import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { blue, red } from 'cli-color';
import { Connection, Model } from 'mongoose';
import { Log, LogSchema } from 'src/common/entities/log.entity';

@Injectable()
export class LogService {
  private logModel: Model<Log>;

  constructor(@InjectConnection() private readonly connection: Connection) {}

  private getLogModel() {
    if (!this.logModel) {
      this.logModel = this.connection.model(Log.name, LogSchema);
    }
    return this.logModel;
  }

  logError(message: string, context?: string, stack?: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `
--------------------------------------------
[${timestamp}]
${message}
Context: ${context || 'N/A'}
Stack: ${stack || 'N/A'}
    `.trim(); // Trim whitespace for cleaner formatting

    try {
      if (process.env.NODE_ENV === 'production') {
        this.logToDb({ message, context, stack, level: 'error' });
      } else {
        console.error(red(logMessage)); // Log to console in non-production
      }
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  logInfo(message: string, context?: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `
--------------------------------------------
[${timestamp}]
${message}
Context: ${context || 'N/A'}
    `.trim(); // Trim whitespace for cleaner formatting

    if (process.env.NODE_ENV === 'production') {
      this.logToDb({ message, context, level: 'info' });
    } else {
      console.log(blue(logMessage));
    }
  }

  logToDb(data: {
    message: string;
    context?: string;
    level?: 'error' | 'info' | 'debug';
    stack?: string;
  }) {
    const model = this.getLogModel();
    model
      .create(data)
      .then((log) => {
        console.log('Log created:', log);
      })
      .catch((err) => console.log(err));
  }
}
