#!/usr/bin/env node
/**
 * Unify zh UI: Studio / 制作方 → 创作者 (Creator)
 * Skips: 制作方案, 制作方向, 制作方式, YouTube Studio, English-only en: blocks
 */
import fs from "fs";
import path from "path";

const roots = ["components", "lib", "app"];
const exts = new Set([".ts", ".tsx"]);

const phraseReplacements = [
  ["制作方匹配", "创作者匹配"],
  ["制作方作品库", "创作者作品库"],
  ["制作方作品", "创作者作品"],
  ["严选的制作方名册", "严选的创作者名册"],
  ["浏览全部制作方", "浏览全部创作者"],
  ["精选制作方作品", "精选创作者作品"],
  ["制作方主页", "创作者主页"],
  ["制作方认证中心", "创作者认证中心"],
  ["制作方功能", "创作者功能"],
  ["制作方提交的", "创作者提交的"],
  ["审阅制作方", "审阅创作者"],
  ["制作方能用的", "创作者能用的"],
  ["进入制作方匹配", "进入创作者匹配"],
  ["分配至您制作方", "分配给您"],
  ["推送至您的制作方", "推送给您"],
  ["匹配制作方", "匹配创作者"],
  ["制作方匹配", "创作者匹配"],
  ["Studio 匹配", "创作者匹配"],
  ["匹配 Studio", "匹配创作者"],
  ["Studio 作品库", "创作者作品库"],
  ["Studio 主页", "创作者主页"],
  ["Studio 审片室", "创作者审片室"],
  ["Studio 门户", "创作者门户"],
  ["Studio 认证中心", "创作者认证中心"],
  ["Studio 认证", "创作者认证"],
  ["Studio 名称", "创作者名称"],
  ["Studio 不存在", "创作者不存在"],
  ["Studio 身份", "创作者身份"],
  ["Studio 负责人", "创作者负责人"],
  ["Studio 财务中心", "创作者财务中心"],
  ["Studio 财务", "创作者财务"],
  ["Studio 收入", "创作者收入"],
  ["Studio 打分", "创作者打分"],
  ["Studio 评分", "创作者评分"],
  ["Studio 作品库", "创作者作品库"],
  ["Studio 库", "创作者库"],
  ["Studio 能用的", "创作者能用的"],
  ["Studio 理解", "创作者理解"],
  ["Studio 提交", "创作者提交"],
  ["Studio 上传", "创作者上传"],
  ["Studio 处理", "创作者处理"],
  ["Studio 修改", "创作者修改"],
  ["Studio 正在", "创作者正在"],
  ["Studio 申请", "创作者申请"],
  ["Studio 回复", "创作者回复"],
  ["Studio 原文", "创作者原文"],
  ["Studio 基本信息", "创作者基本信息"],
  ["已选 Studio", "已选创作者"],
  ["推荐 Studio", "推荐创作者"],
  ["查看 Studio", "查看创作者"],
  ["通知 Studio", "通知创作者"],
  ["等待 Studio", "等待创作者"],
  ["等待制作方", "等待创作者"],
  ["退回 Studio", "退回给创作者"],
  ["给 Studio", "给创作者"],
  ["结算给 Studio", "结算给创作者"],
  ["释放给 Studio", "释放给创作者"],
  ["该 Studio", "该创作者"],
  ["本 Studio", "该创作者"],
  ["这位 Studio", "这位创作者"],
  ["暂无匹配的 Studio", "暂无匹配的创作者"],
  ["暂时没有匹配的 Studio", "暂时没有匹配的创作者"],
  ["为 Studio", "为创作者"],
  ["向 Studio", "向创作者"],
  ["Studio ID", "创作者 ID"],
  ["完善 Studio", "完善创作者"],
  ["解锁 Studio", "解锁创作者"],
  ["认证 Studio", "认证创作者"],
  ["解锁完整 Studio", "解锁完整创作者"],
  ["完善认证 Studio", "完善认证创作者"],
  ["完成入驻并解锁 Studio", "完成入驻并解锁创作者功能"],
  ["公开 Studio 或创作者名称", "公开创作者名称"],
  ["你的公开 Studio 或创作者名称", "你的公开创作者名称"],
  ["Studio 可以开始制作", "创作者可以开始制作"],
  ["Studio 将上传", "创作者将上传"],
  ["Studio 根据意见", "创作者根据意见"],
  ["要求 Studio", "要求创作者"],
  ["不能删除 Studio", "不能删除创作者"],
  ["品牌尚未选定 Studio", "品牌尚未选定创作者"],
  ["高评分 Studio", "高评分创作者"],
  ["档位的 Studio", "档位的创作者"],
  ["合适的 Studio", "合适的创作者"],
  ["风格契合的 Studio", "风格契合的创作者"],
  ["复用本 Studio", "复用该创作者"],
  ["Studio 匹配表现", "创作者匹配表现"],
  ["优先触达高评分 Studio", "优先触达高评分创作者"],
  ["历史订单完成后由 Brand 打分。AI 按系统内置规则综合计算匹配排序，后台与 Studio 均无法修改权重。", "历史订单完成后由品牌方打分。智能系统按内置规则综合计算匹配排序，后台与创作者均无法修改权重。"],
  ["Brand 时间轴批注会同步到 Studio 审片室", "品牌方时间轴批注会同步到创作者审片室"],
  ["Brand 再批准交付", "品牌方再批准交付"],
  ["Brand 已完成托管付款", "品牌方已完成托管付款"],
  ["Brand 批注", "品牌方批注"],
  ["不能删除 Studio 回复", "不能删除创作者回复"],
  ["请先以 Studio 身份登录", "请先以创作者身份登录"],
  ["请填写 Studio 名称", "请填写创作者名称"],
  ["未找到 Studio", "未找到创作者"],
  ["返回 Studio", "返回创作者"],
  ["Stage 2 · Studio 匹配", "第 2 步 · 创作者匹配"],
  ["为你的 Brief 匹配 Studio", "为你的创意简报匹配创作者"],
  ["Studio 发送正式报价", "创作者发送正式报价"],
  ["我们是 Studio X", "我们是某某创作者团队"],
  ["匹配合适档位的 Studio", "匹配合适档位的创作者"],
  ["帮助我们匹配合适档位的 Studio", "帮助我们匹配合适档位的创作者"],
  ["链接或产品图帮助 Studio 理解", "链接或产品图帮助创作者理解"],
  ["整理成 Studio 能用的", "整理成创作者能用的"],
  ["AI 几秒内整理成 Studio 能用的", "智能助手几秒内整理成创作者能用的"],
  ["可以开始匹配 Studio", "可以开始匹配创作者"],
  ["为你匹配 Studio", "为你匹配创作者"],
  ["智能扫描 Studio 库", "智能扫描创作者库"],
  ["Campaign 已付款，可以开始匹配 Studio", "广告项目已付款，可以开始匹配创作者"],
  ["交付已批准，托管款项已释放给 Studio", "交付已批准，托管款项已释放给创作者"],
  ["已申请修改，Studio 将上传新版本", "已申请修改，创作者将上传新版本"],
  ["待 Studio 处理", "待创作者处理"],
  ["Studio 已处理", "创作者已处理"],
  ["Studio 在审片室", "创作者在审片室"],
  ["Studio 处理批注", "创作者处理批注"],
  ["Studio 提交版本", "创作者提交版本"],
  ["等待制作方上传", "等待创作者上传"],
  ["制作方可上传", "创作者可上传"],
  ["制作方匹配", "创作者匹配"],
  ["匹配资深制作团队", "匹配资深创作者"],
  ["全球顶级制作团队", "全球顶级创作者团队"],
  ["吸引全球优秀制作团队", "吸引全球优秀创作者"],
  ["制作方", "创作者"]
];

function shouldProcessLine(line) {
  if (!/[\u4e00-\u9fff]/.test(line)) return false;
  if (/^\s*en:/.test(line) || /locale === "en"/.test(line)) return false;
  return /Studio|制作方/.test(line);
}

function transformLine(line) {
  if (!shouldProcessLine(line)) return line;
  if (/YouTube Studio/.test(line)) {
    let next = line;
    for (const [from, to] of phraseReplacements) {
      if (from === "制作方" || from.includes("Studio") && from !== "Studio") {
        next = next.split(from).join(to);
      }
    }
    return next;
  }
  let next = line;
  for (const [from, to] of phraseReplacements) {
    next = next.split(from).join(to);
  }
  // Fix accidental breaks in compound words
  next = next.replace(/创作方案/g, "制作方案");
  next = next.replace(/创作方向/g, "制作方向");
  next = next.replace(/创作方式/g, "制作方式");
  next = next.replace(/创作者案/g, "制作方案");
  return next;
}

let changed = 0;
for (const root of roots) {
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === "node_modules" || ent.name === ".next") continue;
        walk(p);
        continue;
      }
      if (!exts.has(path.extname(ent.name))) continue;
      const orig = fs.readFileSync(p, "utf8");
      const lines = orig.split("\n");
      const nextLines = lines.map(transformLine);
      const next = nextLines.join("\n");
      if (next !== orig) {
        fs.writeFileSync(p, next);
        changed++;
        console.log("updated", p);
      }
    }
  };
  if (fs.existsSync(root)) walk(root);
}
console.log(`done: ${changed} files`);
