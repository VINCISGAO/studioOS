#!/usr/bin/env node
/**
 * One-off pass: replace common English platform terms inside Chinese UI strings.
 * Safe scope: components/studioos, lib/studioos, lib/marketing, lib/mvp, app/brand
 */
import fs from "fs";
import path from "path";

const roots = ["components/studioos", "lib/studioos", "lib/marketing", "lib/mvp", "components/creator", "app/brand"];
const exts = new Set([".ts", ".tsx"]);

const replacements = [
  ["Campaign 数", "项目数"],
  ["Campaign 历史", "项目历史"],
  ["Campaign 向导", "广告项目向导"],
  ["新建 Campaign", "新建广告项目"],
  ["发布 Campaign", "发布广告项目"],
  ["Campaign 名称", "项目名称"],
  ["Campaign 摘要", "项目摘要"],
  ["进行中的 Campaign", "进行中的广告项目"],
  ["暂无进行中的 Campaign", "暂无进行中的广告项目"],
  ["下一次 Campaign", "下一次广告项目"],
  ["新 Campaign", "新广告项目"],
  ["此 Campaign", "此广告项目"],
  ["该 Campaign", "该广告项目"],
  ["每笔 Campaign", "每笔广告项目"],
  ["搜索 Campaign", "搜索项目"],
  ["选择 Campaign", "选择项目"],
  ["应用到新 Campaign", "应用到新项目"],
  ["用 DNA 创建新 Campaign", "用创意基因创建新广告项目"],
  ["Campaign 已", "广告项目已"],
  ["Campaign 转账", "项目转账"],
  ["Campaign 已付款", "项目已付款"],
  ["Campaign 托管", "项目托管"],
  ["Campaign 选定", "项目选定"],
  ["Campaign 匹配", "项目匹配"],
  ["Campaign 设置", "广告项目设置"],
  ["Campaign 目标", "项目目标"],
  ["夏季 Campaign", "夏季广告项目"],
  ["无权操作此 Campaign", "无权操作此广告项目"],
  ["重新发布 Campaign", "重新发布项目"],
  ["匹配 Creator", "匹配创作者"],
  ["已邀请 Creator", "已邀请创作者"],
  ["Creator 已", "创作者已"],
  ["Brand 批注", "品牌方批注"],
  ["Brand 反馈", "品牌方反馈"],
  ["Brand 首页", "品牌首页"],
  ["Brand 验收", "品牌方验收"],
  ["等待 Studio", "等待制作方"],
  ["通知 Studio", "通知制作方"],
  ["Studio 匹配", "制作方匹配"],
  ["Studio 提交", "制作方提交"],
  ["Studio 上传", "制作方上传"],
  ["Studio 可", "制作方可"],
  ["Studio 主页", "制作方主页"],
  ["Studio 认证", "制作方认证"],
  ["匹配 Studio", "匹配制作方"],
  ["查看 Studio", "查看制作方"],
  ["上传 Version 1", "上传第一版"],
  ["Version 1", "第一版"],
  ["待处理 Issue", "待处理审片意见"],
  ["暂无 Issue", "暂无审片意见"],
  ["优化 Brief", "优化创意简报"],
  ["生成 Brief", "生成创意简报"],
  ["确认 Brief", "确认创意简报"],
  ["待处理 Brief", "待处理创意简报"],
  ["Brand Brief", "品牌创意简报"],
  ["AI 润色", "智能润色"],
  ["AI 生成", "智能生成"],
  ["AI 助手", "智能助手"],
  ["AI 匹配", "智能匹配"],
  ["Campaign", "广告项目"]
];

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
      let text = orig;
      for (const [from, to] of replacements) {
        text = text.split(from).join(to);
      }
      if (text !== orig) {
        fs.writeFileSync(p, text);
        changed++;
        console.log("updated", p);
      }
    }
  };
  if (fs.existsSync(root)) walk(root);
}
console.log(`done: ${changed} files`);
