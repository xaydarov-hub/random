import 'server-only';
import { z } from 'zod';
import { AppError } from '@/types/errors';
import type { Media } from '@/types/app';
import { parseInstagramUrl } from './url-parser';
export const META_SCOPES=['instagram_business_basic','instagram_business_manage_comments'];
const version=process.env.META_API_VERSION??'v25.0';
const graph=`https://graph.instagram.com/${version}`;
export const accountSchema=z.object({id:z.string(),user_id:z.string().optional(),username:z.string(),account_type:z.string().optional(),followers_count:z.number().optional(),profile_picture_url:z.string().optional()});
export type Account=z.infer<typeof accountSchema>;
export const mediaSchema=z.object({id:z.string(),permalink:z.string().url(),caption:z.string().optional(),media_type:z.string().optional(),thumbnail_url:z.string().optional(),media_url:z.string().optional(),comments_count:z.number().optional(),timestamp:z.string().optional(),username:z.string().optional()});
export const commentSchema=z.object({id:z.string(),text:z.string().nullable().optional(),timestamp:z.string().nullable().optional(),from:z.object({id:z.string().optional(),username:z.string().optional()}).optional(),username:z.string().optional(),parent_id:z.string().optional()});
export type Comment=z.infer<typeof commentSchema>;
interface Page<T>{data:T[];paging?:{cursors?:{after?:string};next?:string}}
export interface CommentCursor { after?:string; rootsDone:boolean; replies:{id:string;after?:string}[] }
export interface CommentPage { comments:Comment[]; cursor:CommentCursor|null }
export interface Provider { capabilities:{supportsComments:boolean;supportsFollowerList:boolean;supportsFollowerCheck:boolean}; getAccount():Promise<Account>; resolveMedia(url:string):Promise<Media>; getCommentPage(mediaId:string,cursor:CommentCursor|null):Promise<CommentPage> }
export async function metaFetch<T>(url:string,init?:RequestInit):Promise<T>{
  const response=await fetch(url,{...init,cache:'no-store',signal:AbortSignal.timeout(20000)});
  const result=await response.json();
  if(!response.ok || result.error){const code=result.error?.code; throw new AppError(code===190?'INSTAGRAM_TOKEN_EXPIRED':response.status===429||[4,17,32,613].includes(code)?'RATE_LIMITED':[10,200].includes(code)?'INSTAGRAM_PERMISSION_DENIED':'MEDIA_NOT_ACCESSIBLE','Instagram request failed',response.status===429?429:400);}
  return result as T;
}
export class MetaProvider implements Provider {
  capabilities={supportsComments:true,supportsFollowerList:false,supportsFollowerCheck:false};
  constructor(private token:string,private accountId:string){}
  private request<T>(path:string,params:Record<string,string>={}){const url=new URL(`${graph}/${path}`);Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,v));return metaFetch<T>(url.toString(),{headers:{Authorization:`Bearer ${this.token}`}});}
  async getAccount(){return accountSchema.parse(await this.request('me',{fields:'id,user_id,username,account_type,followers_count,profile_picture_url'}));}
  async resolveMedia(url:string){
    const parsed=parseInstagramUrl(url);if(!parsed)throw new AppError('INVALID_INSTAGRAM_URL','Invalid URL',400);
    const seen=new Set<string>(); let after='';
    for(let page=0;page<500;page++){
      const result=await this.request<Page<Media>>(`${this.accountId}/media`,{fields:'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username,comments_count',limit:'100',...(after?{after}:{})});
      const match=result.data.find(media=>parseInstagramUrl(media.permalink)?.shortcode===parsed.shortcode);if(match)return mediaSchema.parse(match);
      const next=result.paging?.next?result.paging.cursors?.after:undefined;if(!next)break;if(seen.has(next))break;seen.add(next);after=next;
    }
    throw new AppError('MEDIA_NOT_ACCESSIBLE','Media not owned by account',404);
  }
  async getCommentPage(mediaId:string,cursor:CommentCursor|null):Promise<CommentPage>{
    const state:CommentCursor=cursor?structuredClone(cursor):{rootsDone:false,replies:[]};
    if(state.replies.length){
      const item=state.replies[0];
      const page=await this.request<Page<Comment>>(`${item.id}/replies`,{fields:'id,text,timestamp,from',limit:'100',...(item.after?{after:item.after}:{})});
      const next=page.paging?.next?page.paging.cursors?.after:undefined;
      if(next && next===item.after)throw new AppError('MEDIA_NOT_ACCESSIBLE','Repeated pagination cursor',400);
      if(next)item.after=next;else state.replies.shift();
      return {comments:page.data.map(c=>({...commentSchema.parse(c),parent_id:item.id})),cursor:state.rootsDone&&!state.replies.length?null:state};
    }
    const page=await this.request<Page<Comment>>(`${mediaId}/comments`,{fields:'id,text,timestamp,from',limit:'100',...(state.after?{after:state.after}:{})});
    const next=page.paging?.next?page.paging.cursors?.after:undefined;
    if(next && next===state.after)throw new AppError('MEDIA_NOT_ACCESSIBLE','Repeated pagination cursor',400);
    state.after=next;state.rootsDone=!next;state.replies=page.data.map(c=>({id:c.id}));
    return {comments:page.data.map(c=>commentSchema.parse(c)),cursor:state.rootsDone&&!state.replies.length?null:state};
  }
}
export async function exchangeCode(code:string){
  const form=new URLSearchParams({client_id:process.env.META_APP_ID!,client_secret:process.env.META_APP_SECRET!,grant_type:'authorization_code',redirect_uri:process.env.INSTAGRAM_REDIRECT_URI!,code});
  const short=await metaFetch<{access_token:string}>('https://api.instagram.com/oauth/access_token',{method:'POST',body:form});
  const url=new URL('https://graph.instagram.com/access_token');url.searchParams.set('grant_type','ig_exchange_token');url.searchParams.set('client_secret',process.env.META_APP_SECRET!);url.searchParams.set('access_token',short.access_token);
  return metaFetch<{access_token:string;expires_in:number}>(url.toString());
}
export async function refreshToken(token:string){const url=new URL('https://graph.instagram.com/refresh_access_token');url.searchParams.set('grant_type','ig_refresh_token');url.searchParams.set('access_token',token);return metaFetch<{access_token:string;expires_in:number}>(url.toString());}
