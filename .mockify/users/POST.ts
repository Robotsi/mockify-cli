export default async function handle(req: Request, params: Record<string, string>) {
    try {
      const body = await req.json();
      
      // Gelen veriyi kontrol etme simülasyonu
      if (!body.username || !body.password) {
        return {
          status: 400,
          headers: { "X-Custom-Error": "MissingFields" },
          body: { error: "Username and password are required!" }
        };
      }
  
      return {
        status: 201,
        body: {
          message: "User created successfully!",
          userId: Math.floor(Math.random() * 1000),
          capturedParams: params // URL'den yakalanan [id] vb. buraya gelir
        }
      };
    } catch (err) {
      return {
        status: 400,
        body: { error: "Invalid JSON body" }
      };
    }
  }