export async function api<T>(path:string,input?:unknown,method?:string):Promise<T>{
  const response=await fetch('/api/'+path,{method:method??(input===undefined?'GET':'POST'),headers:input===undefined?undefined:{'Content-Type':'application/json'},body:input===undefined?undefined:JSON.stringify(input)});
  const result=await response.json();if(!response.ok)throw new Error(result.message??'So‘rov bajarilmadi.');return result as T;
}
export function dateLabel(value:string){return new Intl.DateTimeFormat('uz-UZ',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}
