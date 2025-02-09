import { Test, TestingModule } from '@nestjs/testing';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PropertyType } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';

const mockedRealtor = {
  id: 'realtorId',
  name: 'string',
  iat: 1,
  exp: 1,
};
const mockedHomeId = 'homeId';
const mockedUpdateHomePayload = {
  id: '9da3f49c-0baf-4431-8410-e190126292ec',
  address: '79 Collar St',
  city: 'Toronto',
  price: 140001,
  propertyType: PropertyType.RESIDENTIAL,
  numberOfBedrooms: 1.5,
  listedDate: '2025-02-06T13:30:45.456Z',
  landSize: 0.2,
};

const mockedUser = {
  id: '2',
  name: 'string',
  iat: 1,
  exp: 1,
};

const mockedHome = mockedUpdateHomePayload;

describe('HomeController', () => {
  let controller: HomeController;
  let homeService: HomeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomeController],
      providers: [
        {
          provide: HomeService,
          useValue: {
            getHomes: jest.fn().mockReturnValue([]),
            getRealtorIdByHomeId: jest.fn().mockReturnValue(mockedRealtor.id),
            updateHomeById: jest.fn().mockReturnValue(mockedUpdateHomePayload),
          },
        },
        PrismaService,
      ],
    }).compile();

    controller = module.get<HomeController>(HomeController);
    homeService = module.get<HomeService>(HomeService);
  });

  describe('getHomes', () => {
    it('should construct filters block correctly', async () => {
      const mockGetHomes = jest.fn().mockReturnValue([]);

      jest.spyOn(homeService, 'getHomes').mockImplementation(mockGetHomes);

      await controller.getHomes('Chicago', '100000', '300000');

      expect(mockGetHomes).toHaveBeenCalledWith({
        price: {
          lte: 300000,
          gte: 100000,
        },
        propertyType: undefined,
        city: 'Chicago',
      });
    });
  });

  describe('updateHome', () => {
    it('should throw unauth error if realtor did not create this home', async () => {
      await expect(
        controller.updateHome(
          'fakeHomeId',
          mockedUpdateHomePayload,
          mockedUser,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update home if realtorId is valid', async () => {
      const mockedUpdateHomeById = jest.fn().mockReturnValue(mockedHome);

      jest
        .spyOn(homeService, 'updateHomeById')
        .mockImplementation(mockedUpdateHomeById);

      const result = await controller.updateHome(
        mockedHomeId,
        mockedUpdateHomePayload,
        mockedRealtor,
      );

      expect(mockedUpdateHomeById).toHaveBeenCalledWith(
        mockedHomeId,
        mockedUpdateHomePayload,
      );

      // expect(result).toEqual(mockedHome);
    });
  });
});
