import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common';
import { IsInt, IsString, Max, Min } from 'class-validator';
import { TrailsService } from './trails.service';

class AddReviewDto {
  @IsString() userId!: string;
  @IsString() userName!: string;
  @IsInt() @Min(1) @Max(5) rating!: number;
  @IsString() comment!: string;
}

@Controller('api/trails')
export class TrailsController {
  constructor(private readonly trailsService: TrailsService) {}

  @Get()
  list(@Query() query: Record<string, string>) {
    return this.trailsService.findAll({
      q: query.q,
      difficulty: query.difficulty as 'easy' | 'moderate' | 'hard' | undefined,
      minDistance: query.minDistance ? Number(query.minDistance) : undefined,
      maxDistance: query.maxDistance ? Number(query.maxDistance) : undefined,
      tag: query.tag,
    });
  }

  @Get(':idOrSlug')
  getOne(@Param('idOrSlug') idOrSlug: string) {
    return this.trailsService.findOne(idOrSlug);
  }

  @Get(':idOrSlug/photos')
  getPhotos(@Param('idOrSlug') idOrSlug: string) {
    return this.trailsService.getTrailPhotos(idOrSlug);
  }

  @Post(':idOrSlug/reviews')
  addReview(@Param('idOrSlug') idOrSlug: string, @Body() body: AddReviewDto) {
    return this.trailsService.addReview(idOrSlug, body);
  }
}
