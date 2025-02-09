import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateHomeDto, HomeResponseDto, UpdateHomeDto } from './dto/home.dto';
import { PropertyType } from '@prisma/client';
import { RequestUser } from 'src/user/interceptors/user.interceptor';

interface GetHomesParam {
  city?: string;
  propertyType?: PropertyType;
  price?: {
    gte?: number;
    lte?: number;
  };
}

const HOME_SELECT = {
  id: true,
  address: true,
  city: true,
  price: true,
  propertyType: true,
  number_of_bathrooms: true,
  number_of_bedrooms: true,
  land_size: true,
};

@Injectable()
export class HomeService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHomes(filter: GetHomesParam): Promise<HomeResponseDto[]> {
    const homes = await this.prismaService.home.findMany({
      select: {
        ...HOME_SELECT,
        images: {
          select: {
            url: true,
          },
          take: 1,
        },
      },
      where: filter,
    });
    return homes.map((home) => {
      const fetchedHome = { ...home, image: home.images[0].url };
      delete fetchedHome.images;
      return new HomeResponseDto(fetchedHome);
    });
  }

  async getHomeById(id: string) {
    const home = await this.prismaService.home.findUnique({
      select: {
        ...HOME_SELECT,
        images: {
          select: {
            url: true,
          },
        },
        realtor: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      where: {
        id,
      },
    });

    return new HomeResponseDto(home);
  }

  async createHome(
    {
      address,
      city,
      images,
      landSize,
      numberOfBathrooms,
      numberOfBedrooms,
      price,
      propertyType,
    }: CreateHomeDto,
    realtorId: string,
  ) {
    const home = await this.prismaService.home.create({
      data: {
        address,
        city,
        price,
        propertyType,
        land_size: landSize,
        number_of_bathrooms: numberOfBathrooms,
        number_of_bedrooms: numberOfBedrooms,
        realtor_id: realtorId,
      },
    });

    const homeImages = images.map((image) => ({ ...image, home_id: home.id }));

    await this.prismaService.image.createMany({ data: homeImages });

    return new HomeResponseDto(home);
  }

  async updateHomeById(id: string, data: UpdateHomeDto) {
    const home = await this.prismaService.home.findUnique({
      where: {
        id,
      },
    });

    if (!home) throw new NotFoundException('Home with provided id not found');

    const updatedHome = await this.prismaService.home.update({
      where: {
        id,
      },
      data,
    });

    return new HomeResponseDto(updatedHome);
  }

  async deleteHomeById(id: string) {
    await this.prismaService.image.deleteMany({ where: { home_id: id } });

    await this.prismaService.home.delete({ where: { id } });
  }

  async getRealtorIdByHomeId(id: string) {
    const home = await this.prismaService.home.findUnique({
      where: {
        id,
      },
      select: {
        realtor_id: true,
      },
    });

    if (!home) throw new NotFoundException();

    return home.realtor_id;
  }

  async inquire(user: RequestUser, homeId: string, message: string) {
    const realtorId = await this.getRealtorIdByHomeId(homeId);

    if (!realtorId) return new NotFoundException();

    return this.prismaService.message.create({
      data: {
        realtor_id: realtorId,
        buyer_id: user.id,
        home_id: homeId,
        message,
      },
    });
  }
}
