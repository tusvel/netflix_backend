import { Injectable, NotFoundException } from '@nestjs/common';
import { DocumentType, ModelType } from '@typegoose/typegoose/lib/types';
import { Types } from 'mongoose';
import { InjectModel } from 'nestjs-typegoose';
import { TelegramService } from '../telegram/telegram.service';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieModel } from './movie.model';

@Injectable()
export class MovieService {
  constructor(
    @InjectModel(MovieModel) private readonly MovieModel: ModelType<MovieModel>,
    private readonly telegramService: TelegramService,
  ) {}

  async bySlug(slug: string) {
    const doc = await this.MovieModel.findOne({ slug })
      .populate('actors genres')
      .exec();
    if (!doc) throw new NotFoundException('Movie not found');
    return doc;
  }

  async byActor(actorId: Types.ObjectId) {
    const docs = await this.MovieModel.find({ actors: actorId }).exec();
    if (!docs) throw new NotFoundException('Movies not found');
    return docs;
  }

  async byGenres(
    genreIds: Types.ObjectId[],
  ): Promise<DocumentType<MovieModel>[]> {
    return this.MovieModel.find({ genres: { $in: genreIds } }).exec();
  }

  async getMostPopular() {
    return this.MovieModel.find({ countOpened: { $gt: 0 } })
      .sort({ countOpened: -1 })
      .populate('genres')
      .exec();
  }

  async getAll(searchTerm?: string) {
    let options = {};

    if (searchTerm) {
      options = {
        $or: [
          {
            title: new RegExp(searchTerm, 'i'),
          },
        ],
      };
    }

    return this.MovieModel.find(options)
      .select('-updatedAt -__v')
      .sort({
        createdAt: 'desc',
      })
      .populate('actors genres')
      .exec();
  }

  async updateCountOpened(slug: string) {
    const updateDoc = await this.MovieModel.findOneAndUpdate(
      { slug },
      {
        $inc: { countOpened: 1 },
      },
      { new: true },
    ).exec();
    if (!updateDoc) throw new NotFoundException('Movie not found');
    return updateDoc;
  }

  /* Admin place */
  async byId(_id: string) {
    const movie = await this.MovieModel.findById(_id);
    if (!movie) throw new NotFoundException('Movie not found');

    return movie;
  }

  async create() {
    const defaultValue: UpdateMovieDto = {
      slug: '',
      actors: [],
      genres: [],
      title: '',
      bigPoster: '',
      poster: '',
      videoUrl: '',
    };
    const movie = await this.MovieModel.create(defaultValue);
    return movie._id;
  }

  async update(_id: string, dto: UpdateMovieDto) {
    if (!dto.isSendTelegram) {
      await this.sendNotification(dto);
      dto.isSendTelegram = true;
    }

    const updateDoc = await this.MovieModel.findByIdAndUpdate(_id, dto, {
      new: true,
    }).exec();
    if (!updateDoc) throw new NotFoundException('Movie not found');
    return updateDoc;
  }

  async delete(id: string) {
    const deleteDoc = await this.MovieModel.findByIdAndDelete(id).exec();
    if (!deleteDoc) throw new NotFoundException('Movie not found');
    return deleteDoc;
  }

  async updateRating(id: Types.ObjectId, newRating: number) {
    return this.MovieModel.findByIdAndUpdate(
      id,
      {
        rating: newRating,
      },
      {
        new: true,
      },
    );
  }

  async sendNotification(dto: UpdateMovieDto) {
    await this.telegramService.sendPhoto(
      `https://i.pinimg.com/564x/53/b6/14/53b6142e58931def02bd58f70c1547b9.jpg`,
    );
    const msg = `<b>${dto.title}</b>\n\n`;

    await this.telegramService.sendMessage(msg, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              url: dto.slug,
              text: '🍿 Go to watch',
            },
          ],
        ],
      },
    });
  }
}
