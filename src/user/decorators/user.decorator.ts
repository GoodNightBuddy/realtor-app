import { createParamDecorator } from '@nestjs/common';
import { CustomRequest } from '../interceptors/user.interceptor';

export const User = createParamDecorator((data, context) => {
  const request = context.switchToHttp().getRequest<CustomRequest>();

  return request.user;
});
