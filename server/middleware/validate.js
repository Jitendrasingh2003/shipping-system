/**
 * Joi Validation Middleware Factory
 * Usage: validate(schema, 'body' | 'query' | 'params')
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });

    if (error) {
      const messages = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
      });
    }

    // Replace req[source] with sanitized & validated values
    req[source] = value;
    next();
  };
};

module.exports = { validate };
