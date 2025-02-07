import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CustomRequest,
  RequestUser,
} from 'src/user/interceptors/user.interceptor';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const roles: string[] = this.reflector.getAllAndOverride<string[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (roles?.length) {
      const request = context.switchToHttp().getRequest<CustomRequest>();
      const token = request.headers?.authorization?.split('Bearer ')[1];
      try {
        const payload = jwt.verify(
          token,
          process.env.JSON_TOKEN_KEY,
        ) as RequestUser;

        if (!payload) return false;

        const user = await this.prismaService.user.findUnique({
          where: {
            id: payload.id,
          },
          select: {
            user_type: true,
          },
        });

        if (!user) return false;
        if (roles.includes(user.user_type)) return true;
        return false;
      } catch (error) {
        return false;
      }
    }
    return true;
  }
}
