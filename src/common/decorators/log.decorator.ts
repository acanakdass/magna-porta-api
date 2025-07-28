import { SetMetadata } from '@nestjs/common';

export const Loggable = () => SetMetadata('loggable', true);