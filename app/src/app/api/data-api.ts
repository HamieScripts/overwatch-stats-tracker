export class DataApi {
  private baseUrl = 'https://overfast-api.tekrop.fr/players';

  async getRawData(id: string): Promise<any> {
    const res = await fetch(${this.baseUrl}/${id});
    if (!res.ok) throw new Error(API error: ${res.status});
    return res.json();
  }
}
