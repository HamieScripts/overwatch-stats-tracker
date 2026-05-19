export class RawDataApi {
  private _baseUrl: string = 'https://overfast-api.tekrop.fr/players';

  async get(id: string): Promise<any> {
    const res = await fetch(`${this._baseUrl}/${id.replace('#', '-')}`);
    
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json();
  }
}
