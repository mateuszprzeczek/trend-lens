import { IsArray, IsIn, IsNotEmpty, IsObject, IsOptional, IsString, ArrayNotEmpty, ArrayUnique } from 'class-validator';

export class GenerateCampaignDto {
  @IsString()
  @IsNotEmpty()
  trendId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  products: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['push', 'email'], { each: true })
  channels: ('push' | 'email')[];

  @IsOptional()
  @IsObject()
  brandPreferences?: Record<string, any>;
}
