// ─── Jeeva Raksha — Input Validation Middleware ───────────────
// Provides reusable validation for request bodies.
// ──────────────────────────────────────────────────────────────

/**
 * Returns Express middleware that checks req.body for required fields.
 * Missing fields trigger a 400 response with a clear error message.
 *
 * Usage:
 *   router.post('/', validateRequired(['name', 'date_of_birth', 'gender']), handler)
 *
 * @param {string[]} fields - Array of required field names
 */
export function validateRequired(fields) {
    return (req, res, next) => {
        const missing = fields.filter(f => {
            const val = req.body[f];
            return val === undefined || val === null || val === '';
        });

        if (missing.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                message: `Missing required fields: ${missing.join(', ')}`,
                missing_fields: missing,
            });
        }

        next();
    };
}

/**
 * Validate that a field matches one of the allowed values.
 *
 * Usage:
 *   router.post('/', validateEnum('gender', ['Male','Female','Other']), handler)
 */
export function validateEnum(field, allowedValues) {
    return (req, res, next) => {
        const val = req.body[field];
        if (val && !allowedValues.includes(val)) {
            return res.status(400).json({
                error: 'Validation failed',
                message: `'${field}' must be one of: ${allowedValues.join(', ')}`,
                received: val,
            });
        }
        next();
    };
}

/**
 * Validate UUID format.
 */
export function validateUUID(paramName = 'id') {
    return (req, res, next) => {
        const val = req.params[paramName];
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (val && !uuidRegex.test(val)) {
            return res.status(400).json({
                error: 'Validation failed',
                message: `'${paramName}' must be a valid UUID`,
            });
        }
        next();
    };
}
