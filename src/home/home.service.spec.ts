import { Test, TestingModule } from '@nestjs/testing';
import { HOME_SELECT, HomeService } from './home.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PropertyType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

const mockGetHomes = [
  {
    id: '1256a1ca-be84-42e8-91be-5c6c47249cad',
    address: '789 Pine Rd',
    city: 'Chicago',
    price: 275000,
    property_type: PropertyType.RESIDENTIAL,
    image: 'https://example.com/images/home3.jpg',
    number_of_bedrooms: 1.5,
    land_size: 0.15,
    images: [
      {
        url: 'https://example.com/images/home3.jpg',
      },
      {
        url: 'https://example.com/images/home2.jpg',
      },
    ],
  },
];

const mockedImages = [
  {
    id: 'a019b8f9-84b5-46e8-8790-d0d65c610084',
    url: 'https://example.com/images/home4.jpg',
  },
  {
    id: 'a019b8f9-84b5-46e8-8790-d0d65c610085',
    url: 'https://example.com/images/home5.jpg',
  },
];

const mockHome = {
  id: '1256a1ca-be84-42e8-91be-5c6c47249cad',
  address: '789 Pine Rd',
  city: 'Chicago',
  price: 275000,
  property_type: PropertyType.RESIDENTIAL,
  number_of_bedrooms: 1.5,
};

describe('HomeService', () => {
  let homeService: HomeService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeService,
        {
          provide: PrismaService,
          useValue: {
            home: {
              findMany: jest.fn().mockReturnValue(mockGetHomes),
              create: jest.fn().mockReturnValue(mockHome),
            },
            image: {
              createMany: jest.fn().mockReturnValue(mockedImages),
            },
          },
        },
      ],
    }).compile();

    homeService = module.get<HomeService>(HomeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getHomes', () => {
    const filters = {
      city: 'Chicago',
      propertyType: PropertyType.RESIDENTIAL,
      price: {
        gte: 100000,
        lte: 300000,
      },
    };

    it('should call prisma findMany with correct params', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue(mockGetHomes);

      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      await homeService.getHomes(filters);

      expect(mockPrismaFindManyHomes).toHaveBeenCalledWith({
        select: {
          ...HOME_SELECT,
          images: {
            select: {
              url: true,
            },
            take: 1,
          },
        },
        where: filters,
      });
    });

    it('should throw NotFoundException if no home not found', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue([]);

      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      await expect(homeService.getHomes(filters)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createHome', () => {
    const mockCreateHomeParams = {
      address: '79 Collar St',
      city: 'Toronto',
      price: 140000,
      propertyType: PropertyType.CONDO,
      images: [
        {
          url: 'https://example.com/images/home6.jpg',
        },
      ],
      numberOfBedrooms: 2,
      numberOfBathrooms: 1.5,
      landSize: 0.2,
    };

    it('should call prisma.home.create with correct payload', async () => {
      const mockCreateHome = jest.fn().mockReturnValue(mockHome);

      jest
        .spyOn(prismaService.home, 'create')
        .mockImplementation(mockCreateHome);

      await homeService.createHome(mockCreateHomeParams, '123');

      expect(mockCreateHome).toHaveBeenCalledWith({
        data: {
          address: '79 Collar St',
          city: 'Toronto',
          price: 140000,
          propertyType: PropertyType.CONDO,
          land_size: 0.2,
          number_of_bathrooms: 1.5,
          number_of_bedrooms: 2,
          realtor_id: '123',
        },
      });
    });

    it('should call prisma.image.createMany with correct payload', async () => {
      const mockCreateImage = jest.fn().mockReturnValue(mockedImages);

      jest
        .spyOn(prismaService.image, 'createMany')
        .mockImplementation(mockCreateImage);

      await homeService.createHome(mockCreateHomeParams, '123');

      expect(mockCreateImage).toHaveBeenCalledWith({
        data: [
          {
            home_id: mockHome.id,
            url: 'https://example.com/images/home6.jpg',
          },
        ],
      });
    });
  });
});
