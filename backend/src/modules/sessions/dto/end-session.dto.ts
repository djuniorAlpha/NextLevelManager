import { IsInt, Min } from 'class-validator';

export class EndSessionDto {
  @IsInt()
  @Min(0)
  consumedSeconds: number;
}
