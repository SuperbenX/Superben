
import { GoogleGenAI, Type } from "@google/genai";
import { DailyItem, DirectorPersona } from "../types";
import { CloudService } from "./cloud";
import { getDailyItems, addDailyItem } from "./storage";

export const AtmosphereGenerator = {
  /**
   * 针对电影、音乐等无预设版块的即时策划
   */
  async generateRippleContent(title: string, author: string, category: string): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        请针对以下条目进行一段充满意境的“深度策划”。
        条目：《${title}》
        分类：${category}
        要求：
        1. 语气：儒雅、平和、具有电影感的画外音。
        2. 内容：不要罗列事实，而是通过文字“素描”出一种氛围。
        3. 字数：约800字。
        4. 目的：作为深夜助眠的文字导赏。
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            temperature: 0.8,
            topP: 0.9,
            thinkingConfig: { thinkingBudget: 0 }
        }
      });

      return response.text || "在这静谧的夜色中，让我们共同沉入这片思绪。";
    } catch (e) {
      console.error("即时策划失败:", e);
      return "思绪在群星中迷失了方向，请试着先闭上眼，听听呼吸。";
    }
  }
};

export const DailyGenerator = {
  async generateTodayIfNeeded(): Promise<DailyItem | null> {
    const now = new Date();
    const todayISO = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const deterministicId = `moment-${todayISO}`;

    const localItems = await getDailyItems();
    const cachedLocal = localItems.find(i => i.id === deterministicId);
    if (cachedLocal) return cachedLocal;

    try {
      const cloudMoments = await CloudService.fetchMoments();
      const cachedCloud = cloudMoments.find(m => m.id === deterministicId);
      if (cachedCloud) {
        addDailyItem(cachedCloud);
        return cachedCloud;
      }
    } catch (e) {
      console.warn("云端同步失败");
    }

    const personas = [DirectorPersona.WONG_KAR_WAI, DirectorPersona.MIYAZAKI, DirectorPersona.TARKOVSKY];
    const selectedPersona = personas[Math.floor(Math.random() * personas.length)];
    
    return await this.fastGenerate(todayISO, deterministicId, selectedPersona);
  },

  async fastGenerate(dateISO: string, id: string, persona: DirectorPersona): Promise<DailyItem | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let personaInstruction = "";
      if (persona === DirectorPersona.WONG_KAR_WAI) {
        personaInstruction = "王家卫：疏离、电影感、充满数字和感官错觉、关于遗憾和时间。";
      } else if (persona === DirectorPersona.MIYAZAKI) {
        personaInstruction = "宫崎骏：清新、治愈、自然主义、充满童真与对大地的敬畏。";
      } else {
        personaInstruction = "塔可夫斯基：深邃、静滞、诗意、关于梦境、镜子 and 永恒。";
      }

      const structResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `
          今天是 ${dateISO}。请作为导演【${personaInstruction}】，为我织造今日的“瞬息”星历。
          
          请严格按照以下【结构范式】进行输出（使用简体中文）：
          1. 第一行：[农历日期]，[环境描述A]，[环境描述B]。
          2. 第二行：[一段极具导演风格的空镜头描写]。
          3. 第三行：今日黄历：宜[动作A]、宜[动作B]、忌[动作C]。
          4. 第四行：[两个生肖名称]，今日适合[心态建议]。
          5. 第五行：[一句对应导演风格的哲学感悟]。
          6. 第六行：[一段关于输赢、价值或时间的体悟]。
          7. 额外信息：[一个感性的温度描述，如 23.5°C]，[一篇相关推荐文章标题]，[推荐文章作者]。

          输出 JSON 格式：
          - lunarDateText: 对应第一行的日期
          - conditionText: 对应第一行的环境描述
          - quoteText: 内容文本 \n。
          - closingText: 总结内容
          - yiText: 宜
          - jiText: 忌
          - fortuneText: 生肖建议
          - imagePrompt: A visual concept style (English).
          - temperatureText: 温度描述
          - nextArticleTitle: 推荐文章标题
          - nextArticleAuthor: 推荐文章作者
        `,
        config: {
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lunarDateText: { type: Type.STRING },
              conditionText: { type: Type.STRING },
              yiText: { type: Type.STRING },
              jiText: { type: Type.STRING },
              fortuneText: { type: Type.STRING },
              quoteText: { type: Type.STRING },
              closingText: { type: Type.STRING },
              imagePrompt: { type: Type.STRING },
              temperatureText: { type: Type.STRING },
              nextArticleTitle: { type: Type.STRING },
              nextArticleAuthor: { type: Type.STRING }
            },
            required: [
              "lunarDateText", "conditionText", "yiText", "jiText", "fortuneText", 
              "quoteText", "closingText", "imagePrompt", "temperatureText", 
              "nextArticleTitle", "nextArticleAuthor"
            ]
          }
        }
      });

      const data = JSON.parse(structResponse.text.trim());
      
      let base64Image = "";
      try {
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: `Style of ${persona}, ${data.imagePrompt || 'calm nature'}, low light, cinematic.` }] },
          config: { imageConfig: { aspectRatio: "9:16" } }
        });

        if (imageResponse.candidates?.[0]?.content?.parts) {
          for (const part of imageResponse.candidates[0].content.parts) {
            if (part.inlineData) base64Image = `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      } catch (imgErr) {
        console.warn("图像生成 500 或超时，使用占位图:", imgErr);
      }

      const now = new Date();
      const newMoment: DailyItem = {
        id, dateISO,
        dayNumber: now.getDate().toString().padStart(2, '0'),
        monthYearText: `${now.getMonth() + 1}月, ${now.getFullYear()}`,
        lunarDateText: data.lunarDateText,
        conditionText: data.conditionText,
        yiText: data.yiText,
        jiText: data.jiText,
        fortuneText: data.fortuneText,
        quoteText: data.quoteText,
        quoteAuthor: persona.replace('_', ' '),
        closingText: data.closingText,
        photoUrl: base64Image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1000',
        photoCredit: '意象 | AI织造',
        locationText: '此刻',
        weatherText: '安然',
        temperatureText: data.temperatureText,
        nextArticleTitle: data.nextArticleTitle,
        nextArticleAuthor: data.nextArticleAuthor,
        persona: persona
      };

      CloudService.syncToCloud(newMoment).catch(console.error);
      return newMoment;
    } catch (e) {
      console.error("织造失败:", e);
      return null;
    }
  }
};
