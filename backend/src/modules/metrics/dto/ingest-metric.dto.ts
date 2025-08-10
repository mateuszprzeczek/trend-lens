import { IsEnum, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export enum MetricEventDtoEnum {
  IMPRESSION = 'IMPRESSION',
  OPEN = 'OPEN',
  CLICK = 'CLICK',
  CONVERSION = 'CONVERSION',
}

export class IngestMetricDto {
  @IsString()
  @IsNotEmpty()
  campaignId: string;

  @IsString()
  @IsNotEmpty()
  channel: string; // e.g., push, email

  @IsOptional()
  @IsString()
  variant?: string; // e.g., A, B

  @IsEnum(MetricEventDtoEnum)
  event: MetricEventDtoEnum; // strict enum

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsISO8601()
  ts: string;
}
