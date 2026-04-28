
/**
 * Notion 智能提取服务 V11 - 深度正文抓取版
 */

export interface NotionPageRef {
  id: string;
  title: string;
  customId?: string;
  category?: string;
  author?: string;
}

const PROXY_PRIMARY = "https://corsproxy.io/?";
const PROXY_FALLBACK = "https://api.allorigins.win/get?url=";

export const NotionService = {
  cleanId(input: string): string {
    let raw = input.trim();
    if (!raw) return "";
    if (raw.includes("notion.so/")) {
      try {
        const url = new URL(raw);
        const pathParts = url.pathname.split("/");
        let idCandidate = pathParts[pathParts.length - 1];
        if (idCandidate.includes("-")) {
          const parts = idCandidate.split("-");
          const last = parts[parts.length - 1];
          if (last.length === 32) idCandidate = last;
        }
        return idCandidate.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
      } catch (e) {}
    }
    const pure = raw.replace(/[^a-zA-Z0-9]/g, "");
    return pure.length >= 32 ? pure.slice(0, 32) : pure;
  },

  async robustFetch(url: string, options: any, useFallback = false): Promise<{ ok: boolean; status: number; data: any }> {
    const proxy = useFallback ? PROXY_FALLBACK : PROXY_PRIMARY;
    const finalUrl = `${proxy}${encodeURIComponent(url)}`;
    try {
      const response = await fetch(finalUrl, options);
      const status = response.status;
      const rawBody = await response.json();
      const data = useFallback ? JSON.parse(rawBody.contents) : rawBody;
      return { ok: response.ok, status, data };
    } catch (e) {
      if (!useFallback) return this.robustFetch(url, options, true);
      return { ok: false, status: 0, data: null };
    }
  },

  /**
   * 探测数据库中的所有书籍记录
   */
  async fetchChildPages(token: string, parentId: string, onLog?: (msg: string) => void): Promise<NotionPageRef[]> {
    const id = this.cleanId(parentId);
    if (!id || id.length !== 32) throw new Error(`无效 ID`);

    const headers = {
      "Authorization": `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    };

    onLog?.(`[探测] 正在连接数据库: ${id}`);
    // 先尝试作为数据库查询
    const dbRes = await this.robustFetch(`https://api.notion.com/v1/databases/${id}/query`, { method: 'POST', headers });

    if (dbRes.ok) {
      const results = dbRes.data.results || [];
      return results.map((page: any) => {
        const props = page.properties;
        // 自动识别标题属性 (Name)
        const titleProp = Object.values(props).find((p: any) => p.type === 'title') as any;
        const title = titleProp?.title?.[0]?.plain_text || "未命名";
        
        let customId = "";
        let category = "";
        let author = "";

        Object.keys(props).forEach(key => {
          const k = key.toUpperCase();
          const p = props[key];
          if (k === 'ID' && p.type === 'rich_text') customId = p.rich_text[0]?.plain_text || "";
          if ((k === 'CATEGORY' || k === '分类') && (p.type === 'select' || p.type === 'rich_text')) {
            category = p.type === 'select' ? p.select?.name : p.rich_text[0]?.plain_text;
          }
          if ((k === 'AUTHOR' || k === '作者') && p.type === 'rich_text') {
            author = p.rich_text[0]?.plain_text;
          }
        });

        return { id: page.id, title, customId, category, author };
      });
    }

    // 如果不是数据库，尝试作为普通页面获取子页面列表
    const blockRes = await this.robustFetch(`https://api.notion.com/v1/blocks/${id}/children?page_size=100`, { headers });
    if (blockRes.ok) {
      return blockRes.data.results
        .filter((b: any) => b.type === 'child_page')
        .map((b: any) => ({ id: b.id, title: b.child_page.title }));
    }
    throw new Error("无法读取 Notion 数据，请检查 Token 权限是否包含此页面/数据库");
  },

  /**
   * 核心方法：进入子页面，递归抓取正文 Blocks
   */
  async fetchPageContent(token: string, pageId: string): Promise<string> {
    const id = this.cleanId(pageId);
    let allText = "";
    let nextCursor: string | undefined = undefined;
    let hasMore = true;
    const headers = { 
      "Authorization": `Bearer ${token}`, 
      "Notion-Version": "2022-06-28" 
    };

    while (hasMore) {
      const url = `https://api.notion.com/v1/blocks/${id}/children?page_size=100${nextCursor ? `&start_cursor=${nextCursor}` : ''}`;
      const res = await this.robustFetch(url, { headers });
      if (!res.ok) break;

      const blocks = res.data.results || [];
      for (const block of blocks) {
        // 只要块中包含 rich_text 属性，就尝试提取
        const blockType = block.type;
        const blockData = block[blockType];
        
        if (blockData && blockData.rich_text && Array.isArray(blockData.rich_text)) {
          const blockText = blockData.rich_text.map((t: any) => t.plain_text).join("");
          if (blockText.trim()) {
            allText += blockText + "\n\n";
          }
        }
      }
      hasMore = res.data.has_more;
      nextCursor = res.data.next_cursor;
    }
    
    return allText.trim();
  }
};
