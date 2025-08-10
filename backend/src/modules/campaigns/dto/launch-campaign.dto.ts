import { IsISO8601, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class LaunchCampaignDto {
  @IsString()
  @IsNotEmpty()
  campaignId: string;

  @IsISO8601()
  schedule: string; // ISO string with timezone

  @IsOptional()
  @IsObject()
  budgets?: Record<string, number>; // e.g., { push: 300, email: 0 }

  @IsOptional()
  @IsObject()
  audiences?: Record<string, string[]>; // e.g., { push: ["all_subscribers"], email: ["newsletter_recent"] }
}
