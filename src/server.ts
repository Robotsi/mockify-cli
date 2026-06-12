// src/server.ts
import { existsSync } from "node:fs";
import { join } from "node:path";
import pc from "picocolors";
import { matchDynamicRoute } from "./router";

export function startServer(port: number) {
  Bun.serve({
    port: port,
    async fetch(req) {
      const url = new URL(req.url);
      const method = req.method; // GET, POST vb.
      const pathname = url.pathname;

      // 1. Özel Query Parametrelerini Yakala
      const statusParam = url.searchParams.get("_status");
      const delayParam = url.searchParams.get("_delay");

      // Terminale düşen logu daha şık ve bilgilendirici yapalım
      console.log(
        `${pc.blue(`[${method}]`)} ${pathname} ${
          delayParam ? pc.yellow(`(Delay: ${delayParam}ms)`) : ""
        } ${statusParam ? pc.magenta(`(Status: ${statusParam})`) : ""}`
      );

      // 2. Gecikme (Delay) Simülasyonu
      if (delayParam) {
        const delayMs = parseInt(delayParam, 10);
        if (!isNaN(delayMs) && delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      // 3. Özel Durum Kodu (Status Code) Simülasyonu
      // Eğer kullanıcı ?_status=401 gibi bir şey attıysa, direkt o HTTP kodunu fırlatacağız
      if (statusParam) {
        const customStatus = parseInt(statusParam, 10);
        if (!isNaN(customStatus) && customStatus >= 200 && customStatus < 600) {
          return new Response(
            JSON.stringify({
              mockify_controlled_error: true,
              message: `Mockify simulated HTTP ${customStatus} status code.`,
              status: customStatus,
            }),
            {
              status: customStatus,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      // --- YÖNLENDİRME (ROUTING) MANTIĞI ---
      const mockifyDir = join(process.cwd(), ".mockify");
      
      // 1. Önce tam statik yolu dene (Örn: .mockify/users/GET.json)
      const targetDir = pathname === "/" ? "index" : pathname;
      let jsonFilePath = join(mockifyDir, targetDir, `${method}.json`);
      let routeParams = {};

      // 2. Statik dosya yoksa, dinamik route aramaya başla
      if (!existsSync(jsonFilePath)) {
        const dynamicMatch = matchDynamicRoute(mockifyDir, pathname);
        
        if (dynamicMatch) {
          jsonFilePath = join(dynamicMatch.filePath, `${method}.json`);
          routeParams = dynamicMatch.params;
        }
      }

      // 3. Dosya bulunduysa içeriği dön
      if (existsSync(jsonFilePath)) {
        const fileContent = await Bun.file(jsonFilePath).text();
        
        // Portföy Şovu: Geliştiriciye yakalanan dinamik parametreleri response header'ında dönelim!
        const responseHeaders = new Headers({
          "Content-Type": "application/json",
          "X-Powered-By": "Mockify CLI",
        });

        if (Object.keys(routeParams).length > 0) {
          responseHeaders.set("X-Mockify-Params", JSON.stringify(routeParams));
        }

        return new Response(fileContent, {
          status: 200,
          headers: responseHeaders,
        });
      }

      // 5. Dosya Bulunamadı Hatası
      return new Response(
        JSON.stringify({ error: `Mock file not found for ${method} ${pathname}` }),
        { 
          status: 404, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    },
  });

  console.log(pc.cyan(`\n✨ Sunucu ayaklandı: http://localhost:${port}`));
  console.log(pc.dim(`Mock dosyalarını okumak için .mockify/ klasörü dinleniyor...\n`));
}