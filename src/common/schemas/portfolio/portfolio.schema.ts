import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

@Schema({ timestamps: true })
export class Portfolio {
   @Prop({ type: String, required: true, unique: true })
   userID!: string

   @Prop({ required: true, unique: true })
   email!: string;

   @Prop({ type: Number, select: true, default: 0 })
   balance!: number;
}


export const PortfolioSchema = SchemaFactory.createForClass(Portfolio);


PortfolioSchema.statics.search = function (keyword: string) {
   const pattern = new RegExp(keyword, 'i'); // case-insensitive

   return this.find({
      $or: [
         { userID: pattern },
         { email: pattern },
      ],
   });
};


export interface PortfolioDocument extends Portfolio, Document { }

export interface PortfolioModel extends Model<PortfolioDocument> {
   search(keyword: string): Promise<PortfolioDocument[]>;
}