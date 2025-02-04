import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { generateProductKeyDto, SignInDto, SignUpDto } from '../auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async signUp({ name, phone, password, email, userType }: SignUpDto) {
    const userExist = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (userExist) {
      throw new ConflictException('email is already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prismaService.user.create({
      data: {
        name,
        phone,
        email,
        password: hashedPassword,
        user_type: userType,
      },
    });

    return this.generateGwt(user.name, user.id);
  }

  async signIn({ email, password }: SignInDto) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email');
    }

    const hashedPassword = user.password;

    const isValidPassword = await bcrypt.compare(password, hashedPassword);

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid password');
    }

    return this.generateGwt(user.name, user.id);
  }

  private generateGwt(name: string, id: string) {
    return jwt.sign(
      {
        name,
        id,
      },
      process.env.JSON_TOKEN_KEY,
      { expiresIn: 36000 },
    );
  }

  generateProductKey({ email, userType }: generateProductKeyDto) {
    const string = `${email}-${userType}-${process.env.PRODUCT_KEY_SECRET}`;
    return bcrypt.hash(string, 10);
  }
}
