
import { GoogleGenAI, Type } from "@google/genai";
import { FinancialData, AIInsight } from "../types.ts";

export const getFinancialInsights = async (data: FinancialData): Promise<AIInsight> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const totalIncome = data.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = data.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalDebt = data.debts
    .filter(d => d.status === 'pending')
    .reduce((sum, d) => sum + d.amount, 0);

  const prompt = `
    Analyze the following financial profile (all values in Bangladeshi Taka - BDT) for user "${data.profile.name}" using the app "Hisebi":
    - Total Income: ৳${totalIncome}
    - Total Expenses: ৳${totalExpense}
    - Total Pending Debt (Dhar): ৳${totalDebt}
    - Monthly Budget: ৳${data.profile.monthlyBudget}
    - Recent Transactions: ${JSON.stringify(data.transactions.slice(-10))}
    
    Provide 3 concise, smart, and actionable financial tips tailored for someone living in Bangladesh. 
    Also, identify if there is an urgent spending alert based on their budget or income-to-debt ratio.
    Reference the user as "Hisebi User" if needed.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of 3 financial advice strings."
            },
            alert: {
              type: Type.STRING,
              description: "A warning message if spending is critical, else null.",
            }
          },
          required: ["tips"]
        }
      }
    });

    const jsonStr = (response.text || "").trim();
    if (!jsonStr) {
      throw new Error("Empty response from model");
    }
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Insights Error:", error);
    return {
      tips: [
        "Review your frequent small expenses (like tea or snacks) to find hidden savings.",
        "Focus on clearing your highest-interest Dhar first to reduce financial burden.",
        "Consider setting a slightly tighter budget goal for next month to build an emergency fund."
      ],
      alert: "AI Insights currently limited. Showing standard recommendations."
    };
  }
};
