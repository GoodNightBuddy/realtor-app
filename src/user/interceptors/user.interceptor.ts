import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express'; // Ensure you're using Express's Request type

export interface RequestUser {
  id: string;
  name: string;
  iat: number;
  exp: number;
}

export interface CustomRequest extends Request {
  user?: RequestUser;
}
export class UserInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<CustomRequest>();
    const authHeader = request.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const user = jwt.decode(token) as RequestUser;
      request.user = user;
    }

    return next.handle();
  }
}
