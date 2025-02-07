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
import { PropertyType } from '@prisma/client';
import { CreateHomeDto, UpdateHomeDto } from './dto/home.dto';
import { User } from 'src/user/decorators/user.decorator';
import { RequestUser } from 'src/user/interceptors/user.interceptor';

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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createHome(@Body() body: CreateHomeDto, @User() user: RequestUser) {
    return this.homeService.createHome(body, user.id);
  }

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
}
