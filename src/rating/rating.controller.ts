import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { Auth } from '../auth/decorators/auth.decorator';
import { IdValidationPipe } from '../pipes/id.validation.pipe';
import { User } from '../user/decorators/user.decorator';
import { SetRatingDto } from './dto/set-rating.dto';
import { RatingService } from './rating.service';

@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Get(':movieId')
  @Auth()
  async getMovieValueByUser(
    @User('_id', IdValidationPipe) _id: Types.ObjectId,
    @Param('movieId', IdValidationPipe) movieId: Types.ObjectId,
  ) {
    return this.ratingService.getMovieValueByUser(movieId, _id);
  }

  @UsePipes(new ValidationPipe())
  @Post('set-rating')
  @HttpCode(200)
  @Auth()
  async setRating(
    @User('_id', IdValidationPipe) _id: Types.ObjectId,
    @Body() dto: SetRatingDto,
  ) {
    return this.ratingService.setRating(_id, dto);
  }
}
