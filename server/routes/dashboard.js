import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/dashboard/stats — aggregated KPIs
router.get('/stats', async (_req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const [
            totalPatients,
            todayVisits,
            opdWaiting,
            bedStats,
            emergencyCases,
            recentVisits,
            statusDist,
            recentAlerts
        ] = await Promise.all([
            // Total patients
            pool.query('SELECT COUNT(*) as count FROM patients WHERE status = $1', ['active']),

            // Today's visits
            pool.query('SELECT COUNT(*) as count FROM visits WHERE DATE(visit_date) = $1', [today]),

            // OPD waiting (in-progress OPD visits today)
            pool.query(
                `SELECT COUNT(*) as count FROM visits
         WHERE visit_type = 'OPD' AND status = 'in-progress' AND DATE(visit_date) = $1`,
                [today]
            ),

            // Bed stats
            pool.query(`
        SELECT
          COUNT(*) as total_beds,
          COUNT(*) FILTER (WHERE status = 'Occupied') as occupied,
          COUNT(*) FILTER (WHERE status = 'Available') as available
        FROM beds
      `),

            // Emergency cases (active today)
            pool.query(
                `SELECT COUNT(*) as count FROM visits
         WHERE visit_type = 'Emergency' AND status = 'in-progress' AND DATE(visit_date) = $1`,
                [today]
            ),

            // Patient inflow by hour (today)
            pool.query(`
        SELECT
          TO_CHAR(visit_date, 'HH24:00') as time,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE triage_level = 'Critical') as critical
        FROM visits
        WHERE DATE(visit_date) = $1
        GROUP BY TO_CHAR(visit_date, 'HH24:00')
        ORDER BY time
      `, [today]),

            // Patient status distribution
            pool.query(`
        SELECT
          COALESCE(triage_level, 'Stable') as name,
          COUNT(*) as value
        FROM visits
        WHERE status = 'in-progress'
        GROUP BY triage_level
      `),

            // Recent audit logs as alerts
            pool.query(`
        SELECT id, action, entity_type, details, created_at
        FROM audit_logs
        ORDER BY created_at DESC LIMIT 5
      `)
        ]);

        const beds = bedStats.rows[0];
        const occupancyRate = beds.total_beds > 0
            ? Math.round((beds.occupied / beds.total_beds) * 100)
            : 0;

        res.json({
            patientsToday: parseInt(todayVisits.rows[0].count),
            totalPatients: parseInt(totalPatients.rows[0].count),
            opdWaiting: parseInt(opdWaiting.rows[0].count),
            bedOccupancy: occupancyRate,
            totalBeds: parseInt(beds.total_beds),
            occupiedBeds: parseInt(beds.occupied),
            availableBeds: parseInt(beds.available),
            emergencyCases: parseInt(emergencyCases.rows[0].count),
            inflowData: recentVisits.rows,
            statusDistribution: statusDist.rows,
            recentAlerts: recentAlerts.rows
        });
    } catch (err) {
        console.error('[dashboard] stats error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
