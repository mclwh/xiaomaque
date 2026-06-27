// 剧本摘要结构化展示：各模块分块渲染并保留间隔
import type { ScriptSummary, ScriptSummaryCharacter } from "@/api/agent";

// ScriptSummaryContentProps 剧本摘要展示属性
type ScriptSummaryContentProps = {
    summary: ScriptSummary;
};

// SummaryFieldBlock 单个摘要字段块
function SummaryFieldBlock({ label, value }: { label: string; value: string }) {
    return (
        <section className="flex flex-col gap-1.5">
            <h4 className="text-sm font-medium text-slate-800">{label}</h4>
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{value}</p>
        </section>
    );
}

// CharacterBlock 单个人物小传块
function CharacterBlock({ character }: { character: ScriptSummaryCharacter }) {
    const fields = [
        { label: "角色类型", value: character.roleType },
        { label: "视觉形象", value: character.visualImage },
        { label: "核心标签", value: character.coreTags },
        { label: "身份背景", value: character.identityBackground },
        { label: "成长经历", value: character.growthExperience },
        { label: "性格特点", value: character.personality },
        { label: "角色关系", value: character.relationships },
        { label: "成长弧线", value: character.growthArc },
    ];

    return (
        <article className="flex flex-col gap-3 rounded-2xl bg-slate-50/80 px-4 py-4">
            <h5 className="text-sm font-medium text-slate-800">
                {character.name}，{character.title}
            </h5>

            <div className="flex flex-col gap-2.5">
                {fields.map((field) => (
                    <div key={field.label} className="flex flex-col gap-0.5">
                        <span className="text-xs text-slate-400">{field.label}</span>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {field.value}
                        </p>
                    </div>
                ))}
            </div>
        </article>
    );
}

// 渲染结构化剧本摘要，模块之间保留视觉间隔
export function ScriptSummaryContent({ summary }: ScriptSummaryContentProps) {
    return (
        <div className="flex flex-col gap-6">
            <SummaryFieldBlock label="自定义集数" value={String(summary.episodeCount)} />
            <SummaryFieldBlock label="故事类型" value={summary.storyType} />
            <SummaryFieldBlock label="目标受众" value={summary.targetAudience} />
            <SummaryFieldBlock label="核心梗" value={summary.coreHook} />
            <SummaryFieldBlock label="一句话故事" value={summary.oneLineStory} />

            <section className="flex flex-col gap-3">
                <h4 className="text-sm font-medium text-slate-800">人物小传</h4>
                <div className="flex flex-col gap-4">
                    {summary.characters.map((character) => (
                        <CharacterBlock key={`${character.name}-${character.title}`} character={character} />
                    ))}
                </div>
            </section>

            <SummaryFieldBlock label="故事梗概" value={summary.synopsis} />
        </div>
    );
}
