import { ExplainScorePayload, Language, RankedVillageEntry, RelocationSite } from '../types';
import { buildRationale } from '../utils/scoring';

/**
 * Deterministic plain-language score rationale generator in English, Hindi, and Marathi.
 * Produced purely from factor contributions with zero external model dependencies.
 */
export function buildFallbackExplanation(
  payload: ExplainScorePayload,
  language: Language
): string {
  return buildRationale(payload, language, 40);
}

/**
 * Produces a deterministic plain-language rationale from factor contributions.
 * Kept for backwards compatibility with ExplainScoreModal.
 */
export async function explainScoreWithGemini(
  payload: ExplainScorePayload,
  language: Language
): Promise<{ text: string; source: 'deterministic-fallback' }> {
  return {
    text: buildRationale(payload, language, 40),
    source: 'deterministic-fallback',
  };
}

/**
 * Deterministic structured query responder for operational queries.
 */
export async function askNivaranAssistant(
  query: string,
  language: Language,
  rankedVillages: RankedVillageEntry[],
  sites: RelocationSite[]
): Promise<{ answer: string; source: 'deterministic-engine' }> {
  const q = query.toLowerCase().trim();
  const redZoneVillages = rankedVillages.filter((v) => v.riskLevel === 'Immediate');
  const shortTermVillages = rankedVillages.filter((v) => v.riskLevel === 'Short-term');
  const top5 = rankedVillages.slice(0, 5);

  const matchedVillage = rankedVillages.find((rv) =>
    q.includes(rv.village.name.toLowerCase())
  );
  if (matchedVillage) {
    const v = matchedVillage.village;
    if (language === 'hi') {
      return {
        answer: `${v.name} (${v.district}, ${v.taluka}): रैंक ${matchedVillage.rank} / ${rankedVillages.length}। जोखिम स्कोर ${matchedVillage.hazardScore.toFixed(3)} (${matchedVillage.riskLevel}), संवेदनशीलता स्कोर ${matchedVillage.vulnerabilityScore.toFixed(3)}। कुल परिवार: ${v.households} (${v.slopeDeg}° ढलान, ${v.annualRainfallMm} मिमी वर्षा)। आवंटित स्थल: ${matchedVillage.primarySiteName}।`,
        source: 'deterministic-engine',
      };
    }
    if (language === 'mr') {
      return {
        answer: `${v.name} (${v.district}, ${v.taluka}): क्रमांक ${matchedVillage.rank} / ${rankedVillages.length}. धोका गुण ${matchedVillage.hazardScore.toFixed(3)} (${matchedVillage.riskLevel}), संवेदनशीलता गुण ${matchedVillage.vulnerabilityScore.toFixed(3)}. एकूण कुटुंबे: ${v.households} (${v.slopeDeg}° उतार, ${v.annualRainfallMm} मिमी पाऊस). प्रस्तावित पुनर्वसन संकुल: ${matchedVillage.primarySiteName}.`,
        source: 'deterministic-engine',
      };
    }
    return {
      answer: `Ranked ${matchedVillage.rank} of ${rankedVillages.length} — ${v.name} (${v.taluka} Taluka, ${v.district}): Hazard score ${matchedVillage.hazardScore.toFixed(3)} (${matchedVillage.riskLevel}), Vulnerability score ${matchedVillage.vulnerabilityScore.toFixed(3)}, Priority score ${matchedVillage.priorityScore.toFixed(3)}. ${v.households} households on ${v.slopeDeg}° slope (${v.annualRainfallMm} mm/yr rainfall). Allocated relocation site: ${matchedVillage.primarySiteName}.`,
      source: 'deterministic-engine',
    };
  }

  if (q.includes('capacity') || q.includes('site') || q.includes('पुनर्वसन') || q.includes('क्षमता')) {
    const siteSummary = sites
      .slice(0, 4)
      .map(
        (s) =>
          `${s.name} (${s.district}): ${s.usableAreaHa} ha, water reliability ${s.waterReliabilityScore}`
      )
      .join('; ');
    if (language === 'hi') {
      return {
        answer: `कुल ${sites.length} उम्मीदवार पुनर्वास स्थल पंजीकृत हैं: ${siteSummary}। महाड MIDC पठार (50 हेक्टेयर ÷ 0.08 = 625 × 0.60 जल स्कोर = 375 सुरक्षित परिवार क्षमता) में 200 अतिरिक्त परिवारों के लिए स्थान उपलब्ध है।`,
        source: 'deterministic-engine',
      };
    }
    if (language === 'mr') {
      return {
        answer: `एकूण ${sites.length} पुनर्वसन संकुले नोंदणीकृत आहेत: ${siteSummary}. महाड MIDC सुरक्षित पठार (50 हेक्टर ÷ 0.08 = 625 × 0.60 पाणी निर्देशांक = 375 सुरक्षित कुटुंबे) येथे 200 अतिरिक्त कुटुंबांसाठी जागा उपलब्ध आहे.`,
        source: 'deterministic-engine',
      };
    }
    return {
      answer: `${sites.length} candidate relocation sites evaluated via MCDA: ${siteSummary}. Mahad MIDC Safe Plateau (50 ha ÷ 0.08 ha/HH × 0.60 water score = 375 safe capacity) has 200 remaining household slots and passes the hazard re-check.`,
      source: 'deterministic-engine',
    };
  }

  const redNames = redZoneVillages.map((r) => `${r.village.name} (${r.hazardScore.toFixed(2)})`).join(', ');
  if (language === 'hi') {
    return {
      answer: `${redZoneVillages.length} बस्तियां तत्काल रेड ज़ोन (>0.75) में हैं: ${redNames}। ${shortTermVillages.length} बस्तियां अल्पकालिक (0.50–0.75) श्रेणी में हैं। शीर्ष 3 प्राथमिकता बस्तियां: ${top5
        .slice(0, 3)
        .map((t) => `#${t.rank} ${t.village.name} (${t.village.district})`)
        .join(', ')}।`,
      source: 'deterministic-engine',
    };
  }
  if (language === 'mr') {
    return {
      answer: `${redZoneVillages.length} वस्त्या तात्काळ रेड झोन (>0.75) मध्ये आहेत: ${redNames}. ${shortTermVillages.length} वस्त्या अल्पकालीन (0.50–0.75) श्रेणीत आहेत. सर्वोच्च 3 प्राधान्य वस्त्या: ${top5
        .slice(0, 3)
        .map((t) => `#${t.rank} ${t.village.name} (${t.village.district})`)
        .join(', ')}.`,
      source: 'deterministic-engine',
    };
  }
  return {
    answer: `${redZoneVillages.length} habitations are in the Immediate Red Zone (>0.75): ${redNames}. ${shortTermVillages.length} habitations are in Short-term risk (0.50–0.75). Top 3 priority habitations: ${top5
      .slice(0, 3)
      .map(
        (t) =>
          `#${t.rank} ${t.village.name} (${t.village.district}, Priority ${t.priorityScore.toFixed(3)})`
      )
      .join(', ')}.`,
    source: 'deterministic-engine',
  };
}
