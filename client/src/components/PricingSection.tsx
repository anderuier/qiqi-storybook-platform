/**
 * PricingSection 组件 - 成本估算展示
 * 设计风格：梦幻童话风格
 */

import { motion } from "framer-motion";
import { 
  Calculator, 
  TrendingDown,
  Check,
  Zap,
  Server
} from "lucide-react";

export default function PricingSection() {
  const apiPricing = [
    { service: "文本生成 (GPT-4.1-mini)", perBook: "$0.01", monthly: "$10" },
    { service: "图像生成 (gpt-image-1)", perBook: "$0.40", monthly: "$400" },
    { service: "语音克隆+TTS (ElevenLabs)", perBook: "$0.15", monthly: "$150" },
    { service: "云服务器 + 存储", perBook: "-", monthly: "$100" }
  ];
  
  const selfHostPricing = [
    { service: "文本生成 (Llama 3)", perBook: "$0.001", monthly: "$1" },
    { service: "图像生成 (SD3)", perBook: "$0.05", monthly: "$50" },
    { service: "语音克隆+TTS (OpenVoice)", perBook: "$0.01", monthly: "$10" },
    { service: "GPU服务器 (AWS g5.xlarge)", perBook: "-", monthly: "$300" },
    { service: "其他云服务", perBook: "-", monthly: "$100" }
  ];
  
  return (
    <section id="pricing" className="py-20 bg-mint/5">
      <div className="container">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mint/10 text-mint mb-4">
            <Calculator className="w-4 h-4" />
            <span className="text-sm font-medium">成本估算</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            透明的<span className="text-coral">成本结构</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            基于每月生成1,000本绘本（每本10页）的估算，提供付费API和开源自建两种方案
          </p>
        </motion.div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 付费API方案 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl p-8 border border-coral/20 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-coral/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-coral" />
              </div>
              <div>
                <h3 className="text-xl font-bold">付费API方案</h3>
                <p className="text-sm text-muted-foreground">快速启动，无需运维</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              {apiPricing.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm">{item.service}</span>
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground w-16 text-right">{item.perBook}/本</span>
                    <span className="font-medium w-16 text-right">{item.monthly}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-coral/5 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">月度总成本</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-coral">~$660</div>
                  <div className="text-sm text-muted-foreground">约 $0.66/本</div>
                </div>
              </div>
            </div>
            
            <ul className="mt-6 space-y-2">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-coral" />
                <span>开箱即用，无需技术团队</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-coral" />
                <span>稳定可靠，服务商保障</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-coral" />
                <span>适合MVP快速验证</span>
              </li>
            </ul>
          </motion.div>
          
          {/* 开源自建方案 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-3xl p-8 border border-mint/20 shadow-lg relative overflow-hidden"
          >
            {/* 推荐标签 */}
            <div className="absolute top-4 right-4 bg-mint text-white text-xs font-medium px-3 py-1 rounded-full">
              推荐
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-mint/10 flex items-center justify-center">
                <Server className="w-6 h-6 text-mint" />
              </div>
              <div>
                <h3 className="text-xl font-bold">开源自建方案</h3>
                <p className="text-sm text-muted-foreground">成本低，定制性强</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              {selfHostPricing.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm">{item.service}</span>
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground w-16 text-right">{item.perBook}/本</span>
                    <span className="font-medium w-16 text-right">{item.monthly}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-mint/5 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">月度总成本</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-mint">~$461</div>
                  <div className="text-sm text-muted-foreground">约 $0.46/本</div>
                </div>
              </div>
            </div>
            
            <ul className="mt-6 space-y-2">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-mint" />
                <span>节省约30%运营成本</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-mint" />
                <span>数据完全私有化</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-mint" />
                <span>可深度定制和优化</span>
              </li>
            </ul>
          </motion.div>
        </div>
        
        {/* 成本对比提示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 bg-sunny/10 rounded-2xl p-6 flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-sunny/20 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-5 h-5 text-sunny" />
          </div>
          <div>
            <h4 className="font-semibold mb-1">成本优化建议</h4>
            <p className="text-sm text-muted-foreground">
              建议MVP阶段先使用付费API快速验证产品价值，待用户量增长后逐步迁移至开源自建方案。
              规模化后，开源方案可节省约30%的运营成本，同时获得更强的定制能力和数据控制权。
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
