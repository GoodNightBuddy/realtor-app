import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { HomeService } from './home.service';
import { PropertyType, UserType } from '@prisma/client';
import { CreateHomeDto, InquireDto, UpdateHomeDto } from './dto/home.dto';
import { User } from 'src/user/decorators/user.decorator';
import { RequestUser } from 'src/user/interceptors/user.interceptor';
import { Roles } from 'src/decorators/roles.decoratoes';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  getHomes(
    @Query('city') city?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('propertyType') propertyType?: PropertyType,
  ) {
    const price =
      minPrice || maxPrice
        ? {
            ...(minPrice && { gte: parseFloat(minPrice) }),
            ...(maxPrice && { lte: parseFloat(maxPrice) }),
          }
        : undefined;

    const filter = {
      ...(city && { city }),
      ...(propertyType && { propertyType }),
      price,
    };

    return this.homeService.getHomes(filter);
  }

  @Get(':id')
  getHome(@Param('id', ParseUUIDPipe) id: string) {
    return this.homeService.getHomeById(id);
  }

  @Roles(UserType.REALTOR)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createHome(@Body() body: CreateHomeDto, @User() user: RequestUser) {
    return this.homeService.createHome(body, user.id);
  }

  @Roles(UserType.REALTOR)
  @Put(':id')
  async updateHome(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateHomeDto,
    @User() user: RequestUser,
  ) {
    const realtorId = await this.homeService.getRealtorIdByHomeId(id);

    if (user.id !== realtorId) throw new UnauthorizedException();

    return this.homeService.updateHomeById(id, body);
  }

  @Roles(UserType.REALTOR)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteHome(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: RequestUser,
  ) {
    const realtorId = await this.homeService.getRealtorIdByHomeId(id);

    if (user.id !== realtorId) throw new UnauthorizedException();

    return this.homeService.deleteHomeById(id);
  }

  @Roles(UserType.BUYER)
  @Post(':id/inquire')
  inquire(
    @Param('id', ParseUUIDPipe) homeId: string,
    @User() user: RequestUser,
    @Body() { message }: InquireDto,
  ) {
    return this.homeService.inquire(user, homeId, message);
  }

  @Roles(UserType.REALTOR)
  @Get(':id/messages')
  async getHomeMessages(
    @Param('id', ParseUUIDPipe) homeId: string,
    @User() user: RequestUser,
  ) {
    const realtorId = await this.homeService.getRealtorIdByHomeId(homeId);

    if (realtorId !== user.id) {
      throw new UnauthorizedException();
    }

    return this.homeService.getMessagesByHomeId(homeId);
  }
}
