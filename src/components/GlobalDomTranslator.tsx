import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { translateTextToLanguage, resolveToEnglish } from '../i18n/domDictionary';
import { Language } from '../types';

const originalTextMap = new WeakMap<Text, string>();
const originalAttrMap = new WeakMap<Element, Record<string, string>>();

const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label'] as const;
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'KBD', 'CANVAS', 'SVG']);
const DEVANAGARI_RE = /[\u0900-\u097F]/;

function isLanguageButtonText(trimmed: string): boolean {
  return (
    trimmed === 'English' ||
    trimmed === 'हिन्दी' ||
    trimmed === 'मराठी' ||
    trimmed === 'EN' ||
    trimmed === 'हिं' ||
    trimmed === 'मरा'
  );
}

function applyTranslationToSubtree(root: Node, language: Language) {
  if (typeof document === 'undefined') return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest('[data-no-translate="true"]')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let currentNode = walker.nextNode() as Text | null;
  while (currentNode) {
    const currentVal = currentNode.nodeValue ?? '';
    const trimmed = currentVal.trim();

    if (trimmed.length > 0 && !isLanguageButtonText(trimmed)) {
      // Find or establish canonical English text for this node
      let baseEnglish = originalTextMap.get(currentNode);
      if (!baseEnglish) {
        if (!DEVANAGARI_RE.test(currentVal)) {
          baseEnglish = currentVal;
        } else {
          baseEnglish = resolveToEnglish(currentVal);
        }
        originalTextMap.set(currentNode, baseEnglish);
      }

      if (language === 'en') {
        if (currentNode.nodeValue !== baseEnglish) {
          currentNode.nodeValue = baseEnglish;
        }
      } else {
        const translated = translateTextToLanguage(baseEnglish, language);
        if (currentNode.nodeValue !== translated) {
          currentNode.nodeValue = translated;
        }
      }
    }
    currentNode = walker.nextNode() as Text | null;
  }

  if (root instanceof Element || root instanceof Document) {
    const elements = root.querySelectorAll('[placeholder], [title], [aria-label]');
    elements.forEach((el) => {
      if (SKIP_TAGS.has(el.tagName)) return;
      let origAttrs = originalAttrMap.get(el);
      if (!origAttrs) {
        origAttrs = {};
        originalAttrMap.set(el, origAttrs);
      }

      for (const attr of TRANSLATABLE_ATTRS) {
        const val = el.getAttribute(attr);
        if (!val || !val.trim()) continue;

        let baseAttr = origAttrs[attr];
        if (!baseAttr) {
          if (!DEVANAGARI_RE.test(val)) {
            baseAttr = val;
          } else {
            baseAttr = resolveToEnglish(val);
          }
          origAttrs[attr] = baseAttr;
        }

        if (language === 'en') {
          if (val !== baseAttr) {
            el.setAttribute(attr, baseAttr);
          }
        } else {
          const nextAttr = translateTextToLanguage(baseAttr, language);
          if (val !== nextAttr) {
            el.setAttribute(attr, nextAttr);
          }
        }
      }
    });
  }
}

export const GlobalDomTranslator: React.FC = () => {
  const language = useAppStore((s) => s.language);
  const location = useLocation();
  const observerRef = useRef<MutationObserver | null>(null);
  const languageRef = useRef<Language>(language);
  const hadNonEnglishRef = useRef<boolean>(language !== 'en');
  languageRef.current = language;
  if (language !== 'en') {
    hadNonEnglishRef.current = true;
  }

  const runSafeTranslationPass = () => {
    const lang = languageRef.current;
    // Skip DOM walk completely if user has stayed in English
    if (lang === 'en' && !hadNonEnglishRef.current) return;

    // Disconnect observer before mutating DOM to prevent recursive microtask loop
    observerRef.current?.disconnect();
    try {
      applyTranslationToSubtree(document.body, lang);
      if (lang === 'en') {
        hadNonEnglishRef.current = false;
      }
    } finally {
      if (languageRef.current !== 'en' && observerRef.current) {
        observerRef.current.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    runSafeTranslationPass();
  }, [language, location.pathname]);

  useEffect(() => {
    let timeoutId: number | null = null;

    const observer = new MutationObserver(() => {
      if (languageRef.current === 'en' && !hadNonEnglishRef.current) return;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        runSafeTranslationPass();
      }, 120);
    });

    observerRef.current = observer;

    if (languageRef.current !== 'en') {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer.disconnect();
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, []);

  return null;
};
