"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const validate = (schema, source = "body") => async (req, res, next) => {
    try {
        if (source === "body") {
            req.body = await schema.parseAsync(req.body);
        }
        else {
            req.query = await schema.parseAsync(req.query);
        }
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(400).json({
                success: false,
                error: "Validation Error",
                details: error.errors.map((e) => ({
                    path: e.path,
                    message: e.message,
                })),
            });
        }
        else {
            next(error);
        }
    }
};
exports.validate = validate;
