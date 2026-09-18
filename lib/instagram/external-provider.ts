import 'server-only';
import { z } from 'zod';
import { accountSchema, mediaSchema, commentSchema, type Provider, type CommentCursor } from './meta-client';
export const externalEnabled=()=>Boolean(process.env.OPTIONAL_INSTAGRAM_PROVIDER_URL && process.env.OPTIONAL_INSTAGRAM_PROVIDER_API_KEY);
export class ExternalProvider implements Provider {
  capabilities={supportsComments:true,supportsFollowerList:false,supportsFollowerCheck:false};
  private async request(path:string,input:unknown){
    if(!externalEnabled())throw new Error('Provider disabled');
    const base=new URL(process.env.OPTIONAL_INSTAGRAM_PROVIDER_URL!);if(base.protocol!=='https:')throw new Error('Provider requires HTTPS');
    const response=await fetch(new URL(path,base.toString().replace(/\/?$/,'/')),{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.OPTIONAL_INSTAGRAM_PROVIDER_API_KEY}`},body:JSON.stringify(input),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw new Error('Provider request failed');return response.json();
  }
  async getAccount(){return accountSchema.parse(await this.request('account',{}));}
  async resolveMedia(url:string){return mediaSchema.parse(await this.request('media/resolve',{url}));}
  async getCommentPage(mediaId:string,cursor:CommentCursor|null){return z.object({comments:z.array(commentSchema).max(100),cursor:z.object({after:z.string().optional(),rootsDone:z.boolean(),replies:z.array(z.object({id:z.string(),after:z.string().optional()})).max(100)}).nullable()}).parse(await this.request('media/comments',{mediaId,cursor}));}
}
