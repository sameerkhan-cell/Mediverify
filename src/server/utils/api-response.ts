export class ApiError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public data: any = null,
        public stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export const ApiResponse = {
    success: (data: any, message: string = "Success", statusCode: number = 200) => ({
        success: true,
        message,
        data,
        statusCode,
    }),
    error: (message: string, statusCode: number = 500, data: any = null) => ({
        success: false,
        message,
        data,
        statusCode,
    }),
};
