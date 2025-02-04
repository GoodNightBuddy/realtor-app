/* eslint-disable prettier/prettier */

import { UserType } from '@prisma/client'
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class SignUpDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Matches(/^\+?[1-9]\d{0,2}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/, {message: 'phone must be valid'})
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  password: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  productKey?: string;

  @IsEnum(UserType, { message: 'userType must be a valid enum value' })
  userType: UserType
}

export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  password: string;
}

export class generateProductKeyDto {
    @IsEmail()
    email: string;

    @IsEnum(UserType, { message: 'userType must be a valid enum value' })
    userType: UserType
}