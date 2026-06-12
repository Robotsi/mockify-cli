// src/router.ts
import { readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";

/**
 * Gelen URL path'ini (örn: /users/123), .mockify klasöründeki 
 * dinamik yapıyla ([id]) eşleştirmeye çalışır.
 */
export function matchDynamicRoute(mockifyDir: string, pathname: string): { filePath: string; params: Record<string, string> } | null {
  // Path'i parçalara ayıralım: ["users", "123"]
  const segments = pathname.split("/").filter(Boolean);
  
  // İç içe klasörleri taramak için yardımcı fonksiyon
  function scan(currentDir: string, segmentIndex: number, currentParams: Record<string, string>): string | null {
    // Eğer tüm segmentleri başarıyla eşleştirdiysek, bu klasörün içindeyiz demektir
    if (segmentIndex === segments.length) {
      return currentDir;
    }

    const currentSegment = segments[segmentIndex];
    
    try {
      const items = readdirSync(currentDir);

      // 1. Önce tam eşleşen (statik) klasör var mı bak: örn: /users/profile
      if (items.includes(currentSegment)) {
        const nextDir = join(currentDir, currentSegment);
        if (statSync(nextDir).isDirectory()) {
          const result = scan(nextDir, segmentIndex + 1, currentParams);
          if (result) return result;
        }
      }

      // 2. Statik yoksa, dinamik klasör var mı bak: örn: [id] veya [slug]
      for (const item of items) {
        if (item.startsWith("[") && item.endsWith("]")) {
          const paramName = item.slice(1, -1); // "id"
          const nextDir = join(currentDir, item);
          
          if (statSync(nextDir).isDirectory()) {
            // Parametreyi kaydet (örn: params.id = "123")
            currentParams[paramName] = currentSegment;
            
            const result = scan(nextDir, segmentIndex + 1, currentParams);
            if (result) return result;
            
            // Eğer bu koldan sonuç çıkmazsa parametreyi sil ve aramaya devam et
            delete currentParams[paramName];
          }
        }
      }
    } catch (e) {
      return null;
    }

    return null;
  }

  const params: Record<string, string> = {};
  const matchedDir = scan(mockifyDir, 0, params);

  if (matchedDir) {
    return { filePath: matchedDir, params };
  }

  return null;
}