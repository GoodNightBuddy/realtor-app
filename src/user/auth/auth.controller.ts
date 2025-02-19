import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { generateProductKeyDto, SignInDto, SignUpDto } from '../auth.dto';
import { UserType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { User } from '../decorators/user.decorator';
import { RequestUser } from '../interceptors/user.interceptor';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up/:userType')
  async signUp(
    @Body() body: SignUpDto,
    @Param('userType', new ParseEnumPipe(UserType)) userType: UserType,
  ) {
    if (userType !== UserType.BUYER) {
      if (!body.productKey) {
        throw new UnauthorizedException();
      }

      const validProductKey = `${body.email}-${userType}-${process.env.PRODUCT_KEY_SECRET}`;
      const isValidProductKey = await bcrypt.compare(
        validProductKey,
        body.productKey,
      );

      if (!isValidProductKey) {
        throw new UnauthorizedException();
      }
    }
    return this.authService.signUp(body);
  }

  @Post('sign-in')
  signIn(@Body() body: SignInDto) {
    return this.authService.signIn(body);
  }

  @Post('key')
  generateProductKey(@Body() body: generateProductKeyDto) {
    return this.authService.generateProductKey(body);
  }

  @Get('me')
  me(@User() user: RequestUser) {
    return user;
  }
}
