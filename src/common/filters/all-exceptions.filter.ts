import { Catch, ArgumentsHost, ExceptionFilter, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();
      
      if (status === HttpStatus.BAD_REQUEST) {
        // Validation errors from class-validator typically throw 400
        const rawMsgs = Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message
          : [exceptionResponse.message];
        const msgs = rawMsgs.map((m: any) => String(m).toLowerCase());
        
        // As per requirements: "Invalid queries must return: { status: error, message: Invalid query parameters }"
        // And "400 Bad Request — Missing or empty parameter"
        // And "422 Unprocessable Entity — Invalid parameter type"
        
        if (msgs.some(m => m.includes('must be a') || m.includes('should not be') || m.includes('is not valid'))) {
           status = HttpStatus.UNPROCESSABLE_ENTITY;
           message = 'Invalid parameter type';
        } else if (msgs.some(m => m.includes('empty') || m.includes('missing'))) {
           status = HttpStatus.BAD_REQUEST;
           message = 'Missing or empty parameter';
        } else {
           // Default fallback for validation issues
           message = 'Invalid query parameters';
        }
      } else {
        message = exception.message || 'Error occurred';
      }
    }

    response.status(status).json({
      status: 'error',
      message: message,
    });
  }
}
