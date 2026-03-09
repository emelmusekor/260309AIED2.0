from __future__ import annotations
import json, os, re, shutil
from pathlib import Path
import pdfplumber
import pypdfium2 as pdfium
from pypdf import PdfReader

def mtag(label: str, *queries: str) -> dict[str, list[str] | str]:
    return {'label': label, 'queries': list(queries) or [label]}

def mgraph(center: str, *nodes: object) -> dict[str, object]:
    labels = []
    for node in nodes:
        if isinstance(node, tuple):
            labels.append({'role': str(node[0]), 'label': str(node[-1])})
        else:
            labels.append({'label': str(node)})
    return {'center': center, 'nodes': labels}

SITE_DIR = Path(__file__).resolve().parent
WORKSPACE_DIR = SITE_DIR.parent
PDF_DIR = WORKSPACE_DIR / 'pdf'
OLD_DIR = WORKSPACE_DIR / 'old'
ASSETS_DIR = SITE_DIR / 'assets'
REPORTS_DIR = SITE_DIR / 'reports'
KO_DIR = SITE_DIR / 'ko'
SHARED_DIR = SITE_DIR / 'shared'

MAIN_KO_PDF = PDF_DIR / '20250829_경인교대_AI 교육 2.0 모형 구현_2.pdf'
MAIN_EN_PDF = PDF_DIR / '20250820_경인교대_AI+교육+2_0+모형+구현_ 번역본.pdf'
SECONDARY_MAIN_PDF = PDF_DIR / '인쇄용 - 중등편 본문 최종_경인교대생성형 AI, 교실 속 협력 파트너_260209.pdf'
SECONDARY_WORKBOOK_PDF = PDF_DIR / '인쇄용 - 중등편 워크북 최종_경인교대생성형 AI, 교실 속 협력 파트너_260209.pdf'
ELEMENTARY_MAIN_PDF = PDF_DIR / '인쇄용 - 초등편 본문 최종_경인교대생성형 AI, 교실 속 협력 파트너_260209.pdf'
ELEMENTARY_WORKBOOK_PDF = PDF_DIR / '인쇄용 - 초등편 워크북 최종_경인교대생성형 AI, 교실 속 협력 파트너_260209.pdf'

PALETTE = ['197,106,77','48,111,125','123,108,36','92,82,132','126,88,115','72,93,152']
MAX_CARD_TAGS = 8
UI = {
    'ko': {'menuLabel':'메뉴','previewLabel':'핵심 요약','pagesLabel':'페이지 원본 보기','pageModalTitle':'페이지 원본','keywordModalTitle':'키워드','closeLabel':'닫기','keywordExcerptLabel':'원문 근거','keywordUsedLabel':'원문 사용 위치','pagesFactLabel':'원본 범위','coverageFactLabel':'분량','browseLabel':'목차부터 보기','jumpLabel':'본문 바로 보기','infoLabel':'정보','searchPlaceholder':'검색어로 장, 카드, 해시태그 찾기','searchClearLabel':'초기화','searchDefaultLabel':'전체 내용을 보고 있습니다.','searchEmptyLabel':'일치하는 결과가 없습니다.','searchResultsPattern':'{count}개 결과','fallback':'이 구간은 원문 페이지에서 바로 확인할 수 있습니다.','worksheetLabel':'학생 입력 워크북','worksheetOpenLabel':'직접 입력써보기','worksheetSharedLabel':'공통 정보','worksheetPagesLabel':'페이지별 직접 입력','worksheetTeacherLabel':'선생님 메일','worksheetTeacherPlaceholder':'teacher@example.com','worksheetMailButtonLabel':'메일 보내기','worksheetDownloadLabel':'입력한 내용으로 PDF 내려받기','worksheetResetLabel':'입력 지우기','worksheetEmptyLabel':'이 페이지는 입력칸이 없습니다.','worksheetFieldsPattern':'입력칸 {count}개','worksheetNotice':'워크북은 페이지별로 따로 열어 입력하고, 입력 내용은 브라우저 안에서만 처리됩니다.','worksheetMailHint':'메일 보내기는 지원 브라우저에서는 PDF 첨부 공유를 시도하고, 그렇지 않으면 PDF를 내려받은 뒤 메일 초안을 엽니다.','worksheetDownloadBusyLabel':'PDF 만드는 중...','worksheetMailBusyLabel':'메일 준비 중...','worksheetMailFallbackLabel':'이 브라우저에서는 메일 첨부 공유를 바로 지원하지 않아 PDF를 먼저 내려받고 메일 초안을 엽니다.'},
    'en': {'menuLabel':'Menu','previewLabel':'Core Summary','pagesLabel':'Source Pages','pageModalTitle':'Source Page','keywordModalTitle':'Keyword','closeLabel':'Close','keywordExcerptLabel':'Source Evidence','keywordUsedLabel':'Used in source','pagesFactLabel':'Source pages','coverageFactLabel':'Coverage','browseLabel':'Browse sections','jumpLabel':'Jump to content','infoLabel':'Info','searchPlaceholder':'Search sections, cards, and hashtags','searchClearLabel':'Clear','searchDefaultLabel':'Showing the full report.','searchEmptyLabel':'No matching results.','searchResultsPattern':'{count} results','fallback':'Open the source pages for the original wording and layout.','worksheetLabel':'Student workbook','worksheetOpenLabel':'Try typing directly','worksheetSharedLabel':'Shared info','worksheetPagesLabel':'Page-by-page input','worksheetTeacherLabel':'Teacher email','worksheetTeacherPlaceholder':'teacher@example.com','worksheetMailButtonLabel':'Send by email','worksheetDownloadLabel':'Download filled PDF','worksheetResetLabel':'Clear inputs','worksheetEmptyLabel':'This page has no editable area.','worksheetFieldsPattern':'{count} fields','worksheetNotice':'Open each workbook page separately and keep input work inside the browser until export.','worksheetMailHint':'When supported, email sharing will try to attach the PDF directly. Otherwise it downloads the PDF first and opens a mail draft.','worksheetDownloadBusyLabel':'Building PDF...','worksheetMailBusyLabel':'Preparing email...','worksheetMailFallbackLabel':'Direct mail sharing is not available in this browser, so the PDF will download first and a mail draft will open.'},
}
SWITCH = {'ko': {'main':'AI교육 2.0','secondary-main':'중등편 본문','secondary-workbook':'중등편 워크북','elementary-main':'초등편 본문','elementary-workbook':'초등편 워크북'}, 'en': {'main':'AI Ed 2.0','secondary-main':'Sec Guide','secondary-workbook':'Sec Workbook','elementary-main':'Elem Guide','elementary-workbook':'Elem Workbook'}}
WORKBOOK_GROUPS = {'secondary-workbook', 'elementary-workbook'}
LEGACY_SITE_ITEMS = ['public','src','.gitignore','eslint.config.js','extract_pdf.cjs','extract_pdf.js','package.json','README.md','vite.config.js']
LEGACY_ROOT_ITEMS = ['node_modules','package.json','package-lock.json']
NOISE_KO = {'한국AI교육학회 2025정책연구보고서','AI교육 2.0 미래를 설계하다','AI교육 2.0','AI기본사회, 교육의 대전환','미래교육의 새로운 패러다임 생성AI, 교실 속 협력 파트너','AI교육 2.0 실전 - 중등편','AI교육 2.0 실전 - 초등편','W o r k b o o k','C O N T E N T S','P R E F A C E'}
NOISE_EN = {'Machine Translated by Google','Korean AI Education Society 2025 Policy Research Report','AI Basic Society: A Major Transformation in Education','Designing the Future of AI Education 2.0','index','References'}
DEV = [{'name':'한선관','role':'총괄 연구'},{'name':'천종필','role':'공동 개발'},{'name':'류미영','role':'공동 개발'}]
REV = [{'name':n} for n in ['이철현','정종진','서지훈','홍수빈','김태령','김도용','임새이','김지혜','김지현','서지인','김상현']]
SECONDARY_AUTHORS = [{'name':'한선관'},{'name':'이문주'},{'name':'송동주'}]
ELEMENTARY_AUTHORS = [{'name':'한선관'},{'name':'류미영'},{'name':'임새이'},{'name':'김지현'},{'name':'서지인'}]

INFO = {
    'main-en': {
        'title': 'Report Info',
        'back': 'Back to report',
        'desc': 'This page collects publication details together with development and review credits for the translated report.',
        'groups': [
            {'kind': 'facts', 'title': 'Basic', 'items': [('Source', 'English translation PDF'), ('Pages', '33 pages'), ('Publisher', 'Korean Society for AI Education'), ('Issued', 'August 2025')]},
            {'kind': 'people', 'title': 'Developers', 'items': [{'name': p['name'], 'role': 'Development'} for p in DEV]},
            {'kind': 'people', 'title': 'Reviewers', 'items': [{'name': p['name'], 'role': 'Review'} for p in REV]},
        ],
    },
    'main-ko': {
        'title': '보고서 정보',
        'back': '보고서로 돌아가기',
        'desc': '이 페이지는 보고서의 기본 정보와 개발진, 검토진 정보를 한곳에 모아 보여줍니다.',
        'groups': [
            {'kind': 'facts', 'title': '기본 정보', 'items': [('원문', '한국어 보고서'), ('분량', '66쪽'), ('발행처', '한국인공지능교육학회'), ('발행일', '2025년 8월')]},
            {'kind': 'people', 'title': '개발진', 'items': DEV},
            {'kind': 'people', 'title': '검토진', 'items': REV},
        ],
    },
    'secondary-main': {
        'title': '중등편 본문 정보',
        'back': '본문으로 돌아가기',
        'desc': '이 페이지는 중등편 본문의 기본 정보와 저자 정보를 따로 모아 보여줍니다.',
        'groups': [
            {'kind': 'facts', 'title': '기본 정보', 'items': [('형태', '인쇄용 본문 PDF'), ('분량', '256쪽'), ('발행처', '연두에디션'), ('발행일', '2026년 2월 28일')]},
            {'kind': 'people', 'title': '저자', 'items': SECONDARY_AUTHORS},
        ],
    },
    'secondary-workbook': {
        'title': '중등편 워크북 정보',
        'back': '워크북으로 돌아가기',
        'desc': '이 페이지는 중등편 워크북의 기본 정보와 저자 정보를 따로 모아 보여줍니다.',
        'groups': [
            {'kind': 'facts', 'title': '기본 정보', 'items': [('형태', '인쇄용 워크북 PDF'), ('분량', '128쪽'), ('발행처', '연두에디션'), ('발행일', '2026년 2월 28일')]},
            {'kind': 'people', 'title': '저자', 'items': SECONDARY_AUTHORS},
        ],
    },
    'elementary-main': {
        'title': '초등편 본문 정보',
        'back': '본문으로 돌아가기',
        'desc': '이 페이지는 초등편 본문의 기본 정보와 저자 정보를 따로 모아 보여줍니다.',
        'groups': [
            {'kind': 'facts', 'title': '기본 정보', 'items': [('형태', '인쇄용 본문 PDF'), ('분량', '348쪽'), ('발행처', '연두에디션'), ('발행일', '2026년 2월 28일')]},
            {'kind': 'people', 'title': '저자', 'items': ELEMENTARY_AUTHORS},
        ],
    },
    'elementary-workbook': {
        'title': '초등편 워크북 정보',
        'back': '워크북으로 돌아가기',
        'desc': '이 페이지는 초등편 워크북의 기본 정보와 저자 정보를 따로 모아 보여줍니다.',
        'groups': [
            {'kind': 'facts', 'title': '기본 정보', 'items': [('형태', '인쇄용 워크북 PDF'), ('분량', '66쪽'), ('발행처', '연두에디션'), ('발행일', '2026년 2월 28일')]},
            {'kind': 'people', 'title': '저자', 'items': ELEMENTARY_AUTHORS},
        ],
    },
}

MAIN_KO = [
    {'id':'intro','nav':'소개','items':[('연구 서문',3,5),("왜 'AI교육 2.0'인가?",6,8),('AI교육 2.0의 목표와 대상',9,10)]},
    {'id':'principles','nav':'핵심 원칙','items':[('모형의 기반: 디지털로부터 출발',11,12),('AGI·ASI를 고려한 교육',13,13),('AI를 제대로 이해해야 하는 이유',14,14),('AI 시대를 준비하는 새로운 사고력',15,15),('AI와 협력해야 하는 이유',16,18),('윤리보다 가치교육',19,19),('새로운 학습이론의 필요성',20,20),('두려움보다 가능성에 주목하는 교육',21,22)]},
    {'id':'structure','nav':'모델 구조','items':[('AI교육 2.0 모형',23,24),('모형의 주요 용어 정의',25,26)]},
    {'id':'details','nav':'세부 내용','items':[('AI기본사회 교육과 새로운 학습이론',27,29),('Digitacy란 무엇인가',30,38),('AI Thinking이란 무엇인가',39,46),('AI사고력으로 확장되는 학습자 인지 수준',47,49),('AI 이해교육',50,52),('AI 협력교육',53,58),('AI 가치교육',59,61)]},
    {'id':'references','nav':'참고문헌','items':[('참고문헌',62,64)]},
]
MAIN_EN = [
    {'id':'introduction','nav':'Introduction','items':[("Why \"AI Education 2.0\"?",2,4),("Goals and Targets of \"AI Education 2.0\"",5,5)]},
    {'id':'principles','nav':'Core Principles','items':[('The Foundation of the Model: It Must Start with Digital',6,6),('Education Designed with the Future of Technology in Mind',7,7),('Properly Understanding AI and New Thinking Skills',8,8),('Why We Need to Collaborate with AI',9,9),('Values Education Rather Than Ethics',10,10),('New Learning Theory and Possibility-Focused Education',11,11)]},
    {'id':'structure','nav':'Model Structure','items':[('AI Education 2.0 Model',12,12),('Definition of Key Model Terms',13,13)]},
    {'id':'details','nav':'Details','items':[('Why Does AI Basic Society Education Require a New Learning Theory?',14,15),('What Is Digitacy?',16,19),('What Is AI Thinking?',20,23),('Learners\' Cognitive Levels Expanded Through AI Thinking',24,25),('AI Understanding Education',26,27),('AI Collaborative Education',28,29),('AI Value Education',30,31)]},
    {'id':'references','nav':'References','items':[('References',32,32)]},
]
SECONDARY_MAIN = [
    {'id':'intro','nav':'소개','items':[('머리말',3,6)]},
    {'id':'first-steps','nav':'AI 협력의 첫걸음','items':[('AI 생성 시대와 교육의 변화',7,12),('AI협력 교육의 개념과 의의',13,17),('AI협력 교육 설계 원리',18,22)]},
    {'id':'getting-started','nav':'생성형 AI 시작하기','items':[('좋은 프롬프트란?',23,29),('제로샷? 원샷? 퓨샷?',30,37),('이게 최선일까요?',38,47),('진짜일까, 가짜일까?',48,56),('어때요, 참 쉽죠?',57,63),('같은 내용, 다른 표현',64,67),('넌 이제 내 거야!',68,73),('한 번 더 생각하고 물어보자',74,80)]},
    {'id':'using-ai','nav':'생성형 AI 활용하기','items':[('내 말 좀 들어봐',81,87),('나도 한 번 써 볼게',88,93),('오늘 나의 일정이 어떻게 되지?',94,100),('나는 선생님이고, 너는 학생이야!',101,106)]},
    {'id':'classroom-methods','nav':'수업 방법','items':[('국어 Book Creator 소개',107,113),('국어 AI와 함께 E-book 만들기',114,130),('영어 Clipchamp 소개',131,136),('영어 모둠 소개 영어 동영상 만들기',137,150),('과학 Canva AI 코드 생성 기능 소개',151,155),('과학 바이브 코딩으로 실험 보고서 작성하기',156,170),('사회 PlayingCard.io 소개',171,176),('사회 역사 속 한 장면으로 보드게임 제작하기',177,202),('음악 BandLab 소개',203,207),('음악 AI 사운드 크리에이터',208,222),('정보 앱 인벤터 AI 확장 기능 소개',223,227),('정보 AI와 함께 앱 개발하기',228,256)]},
]
SECONDARY_WORKBOOK = [
    {'id':'getting-started','nav':'생성형 AI 시작하기','items':[('좋은 프롬프트란?',3,8),('제로샷? 원샷? 퓨샷?',9,12),('이게 최선일까요?',13,18),('진짜일까, 가짜일까?',19,22),('어때요, 참 쉽죠?',23,28),('같은 내용, 다른 표현',29,32),('넌 이제 내 거야!',33,36),('한 번 더 생각하고 물어보자',37,40)]},
    {'id':'using-ai','nav':'생성형 AI 활용하기','items':[('내 말 좀 들어봐',41,42),('나도 한 번 써 볼게',43,46),('오늘 나의 일정이 어떻게 되지?',47,50),('나는 선생님이고, 너는 학생이야!',51,54)]},
    {'id':'subject-activities','nav':'교과 활동','items':[('국어 AI와 함께 E-book 만들기',55,62),('영어 모둠 소개 영어 동영상 만들기',63,72),('과학 바이브 코딩으로 실험 보고서 작성하기',73,84),('사회 역사 속 한 장면으로 보드게임 제작하기',85,98),('음악 AI 사운드 크리에이터',99,106),('정보 AI와 함께 앱 개발하기',107,128)]},
]
ELEMENTARY_MAIN = [
    {'id':'intro','nav':'소개','items':[('머리말',3,9)]},
    {'id':'first-steps','nav':'AI 협력의 첫걸음','items':[('생성형 AI의 확산과 교육적 시사점',10,14),('AI를 파트너로 보는 새로운 학습 패러다임',15,16),('AI교육2.0과 AI협력 교육',17,20),('인간-AI 역할 분담의 교육적 가치',21,24),('사고가 오가는 수업의 구조',25,27),('교사의 준비 - 기술보다 태도',28,29)]},
    {'id':'prompt-lab','nav':'프롬프트 실험실','items':[('AI에게 역할을 설정하자!',30,36),('AI의 글쓰기 형식을 선택하자!',37,40),('AI의 말투를 조정해 보자!',41,44),('나처럼 해봐요, 이렇게!',45,50),('AI가 그린 그림, 내가 따라 그린 그림',51,57),('최종 프롬프트 개선 게임',58,62),('진짜일까, 가짜일까? 판단하자!',63,71),('AI 답변 평가단',72,78),('AI와 토론해 보자!',79,84),('AI 다시쓰기 챌린지',85,90),('AI와 함께 상상하기',91,96),('오늘은 내가 AI의 선생님!',97,101),('나만의 챗봇 만들기',102,106),('AI 책임 기자단',107,112),('AI 안전 약속 만들기',113,117),('AI 공동 창작물 윤리 토론',118,123)]},
    {'id':'classroom-lessons','nav':'교실 수업','items':[('음악 AI와 함께 만드는 우리반 주제가',124,142),('사회·창체 AI와 함께 만드는 우리 마을 지도 발표하기',143,160),('수학 AI와 함께 만드는 수학 퀴즈',161,176),('미술 AI와 함께하는 예술 작가와의 만남',177,188),('창체(진로) AI와 미래 직업 ID 카드 만들기',189,202),('국어 AI로 상상 더하기',203,220),('과학 AI와 함께 만드는 지진 대처 영상',221,236),('국어 AI와 함께 우리반 뉴스 제작하기',237,254),('체육·창체 AI와 함께 만드는 건강 루틴 카드',255,270),('사회 AI와 함께 웹페이지 캠페인 주인공 되기',271,285)]},
    {'id':'student-workbook','nav':'학생용 워크북','items':[('AI에게 역할을 설정하자!',286,290),('AI의 글쓰기 방식을 선택하자!',291,292),('AI의 말투를 조정해 보자!',293,294),('나처럼 해봐요, 이렇게!',295,298),('AI가 그린 그림, 내가 따라 그린 그림',299,307),('최종 프롬프트 개선 게임',308,311),('진짜일까, 가짜일까? 판단하자!',312,316),('AI 답변 평가단',317,324),('AI와 토론해 보자!',325,329),('AI 다시쓰기 챌린지',330,331),('AI와 함께 상상하기',332,335),('오늘은 내가 AI의 선생님!',336,337),('나만의 챗봇 만들기',338,341),('AI 책임 기자단',342,342),('AI 안전 약속 만들기',343,345),('AI 공동 창작물 윤리 토론',346,348)]},
]
ELEMENTARY_WORKBOOK = [
    {'id':'effective-questions','nav':'효과적으로 질문하기','items':[('AI에게 역할을 설정하자!',3,8),('AI의 글쓰기 형식을 선택하자!',9,10),('AI의 말투를 조정해 보자!',11,12),('나처럼 해봐요, 이렇게!',13,16),('AI가 그린 그림, 내가 따라 그린 그림',17,25),('최종 프롬프트 개선 게임',26,28)]},
    {'id':'critical-review','nav':'비판적으로 검토하기','items':[('진짜일까, 가짜일까? 판단하자!',29,34),('AI 답변 평가단',35,42),('AI와 토론해 보자!',43,46)]},
    {'id':'creative-extension','nav':'창의적으로 확장하기','items':[('AI 다시쓰기 챌린지',47,49),('AI와 함께 상상하기',50,53),('오늘은 내가 AI의 선생님!',54,55),('나만의 챗봇 만들기',56,58)]},
    {'id':'ethical-reflection','nav':'윤리적 성찰하기','items':[('AI 책임 기자단',59,60),('AI 안전 약속 만들기',61,63),('AI 공동 창작물 윤리 토론',64,66)]},
]
MANUAL_OVERRIDES = {
    'main-ko': {
        '문제 제기': {'summary':['AI가 도구를 넘어 협력 주체가 되는 변화 속에서 교육이 다시 답해야 할 문제를 제기합니다.'], 'tags':[mtag('교육 전환','교육','전환'), mtag('AI 협력','AI','협력'), mtag('기술 변화','기술','변화'), mtag('살아남기','살아남','생존')], 'graph':mgraph('교육의 재질문', ('배경','기술 변화'), ('질문','교육의 역할'), ('방향','AI 협력')), 'sparse':True},
        '연구 서문': {'summary':['보고서의 작성 배경과 문제의식을 짧게 밝히는 서문입니다.'], 'tags':[mtag('연구 배경','배경'), mtag('협력 파트너','협력','파트너'), mtag('교육 역할','교육','역할'), mtag('AI 전환','AI','전환')], 'graph':mgraph('연구의 문제의식', ('배경','AI 전환'), ('질문','교육 역할'), ('관계','협력 파트너'))},
        '목차': {'summary':['보고서 전체의 장과 절 흐름을 한눈에 파악할 수 있도록 구성 체계를 정리합니다.'], 'tags':[mtag('전체 구조','구조'), mtag('핵심 원칙','핵심 원칙'), mtag('모델 구조','모델 구조'), mtag('세부 영역','세부 내용')], 'graph':mgraph('보고서 구성', ('입구','소개'), ('중심','핵심 원칙'), ('확장','세부 내용')), 'sparse':True},
        'AI교육 2.0 소개': {'summary':['AI교육 2.0이 어떤 문제의식에서 출발하고 어떤 방향으로 재구성되는지 압축해 소개합니다.'], 'tags':[mtag('AI교육 2.0','AI교육 2.0'), mtag('교육 재설계','재설계'), mtag('미래 역량','역량'), mtag('전환 모형','모형','전환')], 'graph':mgraph('AI교육 2.0', ('출발점','교육 재설계'), ('핵심','미래 역량'), ('형태','전환 모형')), 'sparse':True},
        "왜 'AI교육 2.0'인가?": {'summary':['AI기본사회에서 기존 AI교육만으로는 부족한 이유와 새로운 교육 모형이 필요한 배경을 설명합니다.'], 'tags':[mtag('AI기본사회','AI기본사회'), mtag('교육 대전환','대전환'), mtag('새로운 역량','역량'), mtag('학습 이론','학습이론','이론')], 'graph':mgraph('도입 배경', ('환경','AI기본사회'), ('문제','기존 교육의 한계'), ('대안','교육 대전환'))},
        'AI교육 2.0의 목표와 대상': {'summary':['AI교육 2.0이 길러야 할 역량과 적용 대상층을 함께 제시합니다.'], 'tags':[mtag('목표 역량','목표','역량'), mtag('학습 대상','대상'), mtag('AI 이해','이해'), mtag('AI 협력','협력')], 'graph':mgraph('교육 목표', ('대상','학습 대상'), ('역량','AI 이해'), ('실천','AI 협력'))},
        '핵심 원칙 개요': {'summary':['모형 전체를 관통하는 핵심 원칙을 묶어서 보여주는 개요 페이지입니다.'], 'tags':[mtag('디지털 출발','디지털'), mtag('미래 기술','미래 기술'), mtag('협력 중심','협력 중심'), mtag('가치 지향','가치')], 'graph':mgraph('핵심 원칙', ('기반','디지털 출발'), ('관점','미래 기술'), ('지향','가치 지향')), 'sparse':True},
        '모형의 기반: 디지털로부터 출발': {'summary':['AI를 이해하려면 먼저 디지털 작동 원리와 정보 환경을 읽는 기초 역량이 필요하다는 점을 강조합니다.'], 'tags':[mtag('디지털 기초','디지털'), mtag('작동 원리','원리'), mtag('기술 이해','이해'), mtag('기반 역량','기초 역량')], 'graph':mgraph('디지털 기반', ('전제','기술 이해'), ('핵심','작동 원리'), ('결과','기반 역량'))},
        'AGI·ASI를 고려한 교육': {'summary':['현재 기술만이 아니라 AGI와 ASI까지 염두에 둔 장기적 교육 설계가 필요하다고 봅니다.'], 'tags':[mtag('AGI','AGI'), mtag('ASI','ASI'), mtag('미래 준비','미래'), mtag('기술 전망','기술')], 'graph':mgraph('미래 기술 대응', ('범위','AGI'), ('전망','ASI'), ('설계','미래 준비'))},
        'AI를 제대로 이해해야 하는 이유': {'summary':['AI를 도구처럼 쓰기 전에 데이터, 알고리즘, 모델의 작동과 한계를 이해해야 한다는 원칙입니다.'], 'tags':[mtag('AI 이해','AI','이해'), mtag('데이터','데이터'), mtag('알고리즘','알고리즘'), mtag('모델','모델')], 'graph':mgraph('AI 이해', ('재료','데이터'), ('원리','알고리즘'), ('구성','모델'))},
        'AI 시대를 준비하는 새로운 사고력': {'summary':['AI와 함께 문제를 다시 정의하고 해결하는 사고 틀로서 AI사고력을 제시합니다.'], 'tags':[mtag('AI 사고력','AI사고력','AI Thinking'), mtag('추상화','추상화'), mtag('자동화','자동화'), mtag('자율화','자율화')], 'graph':mgraph('AI 사고력', ('과정','추상화'), ('전환','자동화'), ('확장','자율화'))},
        'AI와 협력해야 하는 이유': {'summary':['AI를 대체자보다 협력 파트너로 보고 역할을 나누는 학습 구조를 제안합니다.'], 'tags':[mtag('AI 협력','협력'), mtag('역할 분담','역할'), mtag('공동 문제해결','문제해결'), mtag('파트너십','파트너')], 'graph':mgraph('협력 구조', ('관계','파트너십'), ('운영','역할 분담'), ('목표','공동 문제해결'))},
        '윤리보다 가치교육': {'summary':['규범 준수만이 아니라 어떤 사회와 관계를 만들 것인지 묻는 가치 중심 교육을 강조합니다.'], 'tags':[mtag('가치교육','가치교육'), mtag('인간 중심','인간 중심'), mtag('사회 방향','사회'), mtag('기술 판단','판단')], 'graph':mgraph('가치 중심 교육', ('기준','인간 중심'), ('질문','사회 방향'), ('판단','기술 판단'))},
        '새로운 학습이론의 필요성': {'summary':['인간과 AI가 함께 학습하는 시대에 맞는 새로운 학습이론이 필요하다는 문제를 제기합니다.'], 'tags':[mtag('학습이론','학습이론'), mtag('메타협력주의','메타협력주의'), mtag('인간-AI 관계','인간-AI'), mtag('학습 재설계','재설계')], 'graph':mgraph('새 학습이론', ('배경','인간-AI 관계'), ('핵심','메타협력주의'), ('과제','학습 재설계'))},
        '두려움보다 가능성에 주목하는 교육': {'summary':['위협 담론보다 학습자와 교사가 활용할 수 있는 가능성과 성장의 방향에 초점을 둡니다.'], 'tags':[mtag('가능성 중심','가능성'), mtag('학습자 성장','성장'), mtag('적응','적응'), mtag('협력 미래','미래')], 'graph':mgraph('가능성의 관점', ('대비','두려움'), ('초점','학습자 성장'), ('미래','협력 미래'))},
        'AI교육 2.0 모형': {'summary':['AI 이해교육, AI 협력교육, AI 가치교육이 어떻게 하나의 모형으로 묶이는지 보여줍니다.'], 'tags':[mtag('세 영역','세 영역'), mtag('AI 이해교육','이해교육'), mtag('AI 협력교육','협력교육'), mtag('AI 가치교육','가치교육')], 'graph':mgraph('AI교육 2.0 모형', ('영역 1','AI 이해교육'), ('영역 2','AI 협력교육'), ('영역 3','AI 가치교육'))},
        '모형의 주요 용어 정의': {'summary':['모형을 읽기 위해 필요한 핵심 용어를 정리하고 개념 간 관계를 맞춰 줍니다.'], 'tags':[mtag('Digitacy','Digitacy'), mtag('AI Thinking','AI Thinking'), mtag('메타협력주의','메타협력주의'), mtag('AI기본사회','AI기본사회')], 'graph':mgraph('핵심 용어', ('기초 역량','Digitacy'), ('사고 체계','AI Thinking'), ('이론 틀','메타협력주의'))},
        'AI기본사회 교육과 새로운 학습이론': {'summary':['AI기본사회에 맞는 교육은 인간-AI 상호작용을 전제로 한 학습이론 위에서 다시 설계되어야 한다고 설명합니다.'], 'tags':[mtag('AI기본사회','AI기본사회'), mtag('학습이론','학습이론'), mtag('메타협력주의','메타협력주의'), mtag('협력 관계','협력')], 'graph':mgraph('학습이론 재설계', ('배경','AI기본사회'), ('핵심','메타협력주의'), ('관계','협력 관계'))},
        'Digitacy란 무엇인가': {'summary':['문해력과 수리력처럼 AI기본사회에서 필수적인 디지털 기초 소양으로서 Digitacy를 정의합니다.'], 'tags':[mtag('Digitacy','Digitacy'), mtag('디지털 문해력','문해력'), mtag('데이터 리터러시','데이터'), mtag('사회 적용','사회')], 'graph':mgraph('Digitacy', ('기초','디지털 문해력'), ('자료','데이터 리터러시'), ('실천','사회 적용'))},
        'AI Thinking이란 무엇인가': {'summary':['추상화, 자동화, 지능화, 자율화를 축으로 AI와 함께 문제를 다루는 사고 체계를 설명합니다.'], 'tags':[mtag('AI 사고력','AI Thinking'), mtag('추상화','추상화'), mtag('자동화','자동화'), mtag('지능화','지능화')], 'graph':mgraph('AI Thinking', ('단계 1','추상화'), ('단계 2','자동화'), ('단계 3','지능화'))},
        'AI사고력으로 확장되는 학습자 인지 수준': {'summary':['AI사고력이 학습자의 인지 수준을 어떻게 넓히는지 단계적으로 제시합니다.'], 'tags':[mtag('인지 수준','인지'), mtag('학습 확장','확장'), mtag('사고 순환','순환'), mtag('인간-AI 협력','인간-AI')], 'graph':mgraph('인지 확장', ('매개','AI사고력'), ('과정','사고 순환'), ('결과','학습 확장'))},
        'AI 이해교육': {'summary':['데이터, 알고리즘, 모델을 이해하고 AI의 한계를 판단할 수 있도록 하는 영역입니다.'], 'tags':[mtag('AI 이해교육','이해교육'), mtag('데이터','데이터'), mtag('알고리즘','알고리즘'), mtag('모델','모델')], 'graph':mgraph('AI 이해교육', ('대상','데이터'), ('원리','알고리즘'), ('판단','모델'))},
        'AI 협력교육': {'summary':['AI를 함께 일하는 주체로 보고 역할을 나누며 문제를 해결하는 교육 영역입니다.'], 'tags':[mtag('AI 협력교육','협력교육'), mtag('역할 분담','역할'), mtag('공동 문제해결','문제해결'), mtag('상호작용','상호작용')], 'graph':mgraph('AI 협력교육', ('관계','상호작용'), ('운영','역할 분담'), ('목표','공동 문제해결'))},
        'AI 가치교육': {'summary':['AI 시대에 무엇이 바람직한 사회와 관계인지 판단하는 가치 중심 교육 영역입니다.'], 'tags':[mtag('AI 가치교육','가치교육'), mtag('인간 중심','인간 중심'), mtag('사회 가치','가치'), mtag('방향 설정','방향')], 'graph':mgraph('AI 가치교육', ('기준','인간 중심'), ('질문','사회 가치'), ('결정','방향 설정'))},
        '참고문헌 안내': {'summary':['보고서의 개념과 주장을 뒷받침하는 참고 자료의 범위를 안내합니다.'], 'tags':[mtag('참고문헌','참고문헌'), mtag('선행연구','연구'), mtag('이론 근거','이론'), mtag('정책 연구','정책')], 'graph':mgraph('참고 자료', ('성격','선행연구'), ('역할','이론 근거'), ('범위','정책 연구')), 'sparse':True},
        '참고문헌': {'summary':['보고서가 기대는 국내외 연구와 정책 자료를 정리한 목록입니다.'], 'tags':[mtag('참고문헌','참고문헌'), mtag('선행연구','연구'), mtag('이론 근거','이론'), mtag('정책 연구','정책')], 'graph':mgraph('연구 근거', ('자료','참고문헌'), ('기반','선행연구'), ('연결','정책 연구'))},
    },
    'main-en': {
        'Research Introduction': {'summary':['Frames why education must respond differently as AI shifts from tool to collaborative partner.'], 'tags':[mtag('AI', 'AI'), mtag('Educational shift','education','shift'), mtag('Collaboration','collaboration','partner'), mtag('Technology change','technology','change')], 'graph':mgraph('Educational reframing', ('Context','Technology change'), ('Question','Education’s role'), ('Direction','Collaboration')), 'sparse':True},
        'Index': {'summary':['Maps the full report structure so the reader can move from principles to model components and detailed domains.'], 'tags':[mtag('Report structure','structure'), mtag('Core principles','principles'), mtag('Model structure','model'), mtag('Detailed domains','details')], 'graph':mgraph('Report map', ('Entry','Introduction'), ('Core','Principles'), ('Expansion','Detailed domains')), 'sparse':True},
        'Why "AI Education 2.0"?': {'summary':['Explains why a new educational frame is needed for an AI-based society rather than a narrow tool-use model.'], 'tags':[mtag('AI-based society','AI Basic Society','society'), mtag('Educational transformation','transformation'), mtag('New competencies','competencies'), mtag('Learning theory','theory')], 'graph':mgraph('Need for change', ('Context','AI-based society'), ('Problem','Old frame'), ('Response','Educational transformation'))},
        'Goals and Targets of "AI Education 2.0"': {'summary':['Defines the capabilities AI Education 2.0 seeks to build and the learner groups it addresses.'], 'tags':[mtag('Learning targets','targets'), mtag('Core capabilities','capabilities'), mtag('AI understanding','understanding'), mtag('AI collaboration','collaboration')], 'graph':mgraph('Educational targets', ('Audience','Learning targets'), ('Capability','AI understanding'), ('Practice','AI collaboration'))},
        'The Foundation of the Model: It Must Start with Digital': {'summary':['Argues that AI education must begin with a sound understanding of digital systems and information processes.'], 'tags':[mtag('Digital foundation','digital'), mtag('Technical understanding','understanding'), mtag('Operating principles','principles'), mtag('Base literacy','literacy')], 'graph':mgraph('Digital foundation', ('Premise','Technical understanding'), ('Core','Operating principles'), ('Outcome','Base literacy'))},
        'Education Designed with the Future of Technology in Mind': {'summary':['Treats education as a long-term design task that must anticipate AGI and ASI, not only current tools.'], 'tags':[mtag('Future technology','future','technology'), mtag('AGI','AGI'), mtag('ASI','ASI'), mtag('Long-term design','design')], 'graph':mgraph('Future-ready design', ('Scope','AGI'), ('Horizon','ASI'), ('Task','Long-term design'))},
        'Properly Understanding AI and New Thinking Skills': {'summary':['Links accurate understanding of AI systems with the need for a new mode of thinking that works with AI.'], 'tags':[mtag('AI understanding','understanding'), mtag('AI Thinking','AI Thinking'), mtag('Data and models','data','model'), mtag('New thinking','thinking')], 'graph':mgraph('Understanding and thinking', ('Input','AI understanding'), ('Shift','New thinking'), ('Result','AI Thinking'))},
        'Why We Need to Collaborate with AI': {'summary':['Proposes cooperation with AI as a learning structure built on role-sharing and joint problem solving.'], 'tags':[mtag('AI collaboration','collaboration'), mtag('Role sharing','role'), mtag('Joint problem solving','problem solving'), mtag('Partnership','partner')], 'graph':mgraph('Collaborative structure', ('Relation','Partnership'), ('Operation','Role sharing'), ('Goal','Joint problem solving'))},
        'Values Education Rather Than Ethics': {'summary':['Moves beyond rule-following toward questions about what kind of society and relationships should be built with AI.'], 'tags':[mtag('Values education','values'), mtag('Human-centered','human'), mtag('Social direction','society'), mtag('Judgment','judgment')], 'graph':mgraph('Value-centered education', ('Standard','Human-centered'), ('Question','Social direction'), ('Decision','Judgment'))},
        'New Learning Theory and Possibility-Focused Education': {'summary':['Calls for a new learning theory suited to ongoing human-AI interaction and a possibility-focused stance.'], 'tags':[mtag('Learning theory','theory'), mtag('Metacooperationism','metacooperationism'), mtag('Human-AI interaction','interaction'), mtag('Possibility focus','possibility')], 'graph':mgraph('New learning theory', ('Background','Human-AI interaction'), ('Core','Metacooperationism'), ('Attitude','Possibility focus'))},
        'AI Education 2.0 Model': {'summary':['Shows how AI Understanding Education, AI Collaborative Education, and AI Value Education form one integrated model.'], 'tags':[mtag('Three domains','domains'), mtag('AI Understanding Education','understanding education'), mtag('AI Collaborative Education','collaborative education'), mtag('AI Value Education','value education')], 'graph':mgraph('AI Education 2.0 Model', ('Domain 1','AI Understanding'), ('Domain 2','AI Collaboration'), ('Domain 3','AI Value'))},
        'Definition of Key Model Terms': {'summary':['Clarifies the concepts needed to read the model, including Digitacy, AI Thinking, and Metacooperationism.'], 'tags':[mtag('Digitacy','Digitacy'), mtag('AI Thinking','AI Thinking'), mtag('Metacooperationism','Metacooperationism'), mtag('AI-based society','society')], 'graph':mgraph('Key terms', ('Literacy','Digitacy'), ('Thinking','AI Thinking'), ('Theory','Metacooperationism'))},
        'Why Does AI Basic Society Education Require a New Learning Theory?': {'summary':['Explains why education in an AI-based society needs a learning theory built around human-AI interaction.'], 'tags':[mtag('AI-based society','society'), mtag('Learning theory','theory'), mtag('Metacooperationism','Metacooperationism'), mtag('Human-AI relation','human','AI')], 'graph':mgraph('Reframing learning', ('Context','AI-based society'), ('Core','Metacooperationism'), ('Relation','Human-AI relation'))},
        'What Is Digitacy?': {'summary':['Defines Digitacy as the digital foundation required for living and acting in an AI-based society.'], 'tags':[mtag('Digitacy','Digitacy'), mtag('Digital literacy','digital'), mtag('Data literacy','data'), mtag('Social application','society')], 'graph':mgraph('Digitacy', ('Base','Digital literacy'), ('Resource','Data literacy'), ('Use','Social application'))},
        'What Is AI Thinking?': {'summary':['Describes AI Thinking as a problem-framing and problem-solving mode built around abstraction, automation, intelligence, and autonomy.'], 'tags':[mtag('AI Thinking','AI Thinking'), mtag('Abstraction','abstraction'), mtag('Automation','automation'), mtag('Intelligence','intelligence')], 'graph':mgraph('AI Thinking', ('Step 1','Abstraction'), ('Step 2','Automation'), ('Step 3','Intelligence'))},
        "Learners' Cognitive Levels Expanded Through AI Thinking": {'summary':['Shows how AI Thinking expands learners’ cognitive levels rather than simply speeding up existing tasks.'], 'tags':[mtag('Cognitive expansion','cognitive'), mtag('Learning progression','learning'), mtag('Human-AI interaction','interaction'), mtag('Thinking cycle','thinking')], 'graph':mgraph('Cognitive expansion', ('Driver','AI Thinking'), ('Process','Thinking cycle'), ('Result','Learning progression'))},
        'AI Understanding Education': {'summary':['Covers data, algorithms, and models so learners can understand how AI works and where its limits lie.'], 'tags':[mtag('AI Understanding','understanding'), mtag('Data','data'), mtag('Algorithms','algorithm'), mtag('Models','model')], 'graph':mgraph('AI Understanding Education', ('Input','Data'), ('Logic','Algorithms'), ('Judgment','Models'))},
        'AI Collaborative Education': {'summary':['Treats AI as a collaborative partner and designs learning around role-sharing and co-solving.'], 'tags':[mtag('AI Collaboration','collaboration'), mtag('Role sharing','role'), mtag('Co-solving','solve','problem'), mtag('Interaction','interaction')], 'graph':mgraph('AI Collaborative Education', ('Relation','Interaction'), ('Operation','Role sharing'), ('Goal','Co-solving'))},
        'AI Value Education': {'summary':['Focuses on judging what counts as a desirable human-AI society rather than merely following rules.'], 'tags':[mtag('AI Value Education','value'), mtag('Human-centered','human'), mtag('Social values','social'), mtag('Direction setting','direction')], 'graph':mgraph('AI Value Education', ('Standard','Human-centered'), ('Question','Social values'), ('Decision','Direction setting'))},
        'References': {'summary':['Lists the studies and source materials that ground the report.'], 'tags':[mtag('References','references'), mtag('Prior research','research'), mtag('Theoretical basis','theory'), mtag('Policy sources','policy')], 'graph':mgraph('Research basis', ('Type','References'), ('Support','Prior research'), ('Scope','Policy sources')), 'sparse':True},
    },
}
REPORT_PATTERNS = {
    'secondary-main': [
        {'match': r'^머리말$', 'summary':['보고서의 배경과 현장 적용의 문제의식을 여는 서문입니다.'], 'tags':[mtag('문제의식','문제의식'), mtag('교실 변화','교실'), mtag('AI 협력','AI','협력'), mtag('수업 방향','수업')], 'graph':mgraph('수업의 출발점', ('배경','교실 변화'), ('관계','AI 협력'), ('방향','수업 방향')), 'sparse':True},
        {'match': r'^목차$', 'summary':['전체 활동과 수업 흐름을 훑어볼 수 있는 구성 안내입니다.'], 'tags':[mtag('전체 구조','구조'), mtag('활동 흐름','활동'), mtag('수업 준비','수업'), mtag('활용 영역','활용')], 'graph':mgraph('활동 구성', ('입구','도입'), ('중심','실습'), ('확장','교과 활동')), 'sparse':True},
        {'match': r'도입|첫걸음', 'summary':['AI 협력 수업이 왜 필요한지와 어떤 관점으로 시작해야 하는지를 정리합니다.'], 'tags':[mtag('도입 맥락','도입'), mtag('AI 협력','AI','협력'), mtag('수업 방향','수업'), mtag('학습 관점','학습')], 'graph':mgraph('AI 협력의 출발', ('배경','교육 변화'), ('관점','AI 협력'), ('실천','수업 방향'))},
        {'match': r'교육의 변화|확산|시사점', 'summary':['생성형 AI 확산이 교실과 학습 환경을 어떻게 바꾸는지 설명합니다.'], 'tags':[mtag('AI 확산','확산'), mtag('교육 변화','변화'), mtag('교실 전환','교실'), mtag('학습 환경','학습')], 'graph':mgraph('교육 변화 읽기', ('배경','AI 확산'), ('영향','교실 전환'), ('결과','학습 환경'))},
        {'match': r'개념과 의의|패러다임|역할 분담|교육적 가치', 'summary':['AI 협력 교육의 개념과 교육적 의미, 인간-AI 역할 분담의 가치를 정리합니다.'], 'tags':[mtag('핵심 개념','개념'), mtag('교육적 의의','의의'), mtag('학습 패러다임','패러다임'), mtag('역할 분담','역할')], 'graph':mgraph('AI 협력의 의미', ('개념','핵심 개념'), ('가치','교육적 의의'), ('관계','역할 분담'))},
        {'match': r'설계 원리|수업의 구조|준비', 'summary':['AI 협력 수업을 설계하고 운영할 때 필요한 원리와 준비 요소를 짚습니다.'], 'tags':[mtag('설계 원리','설계'), mtag('수업 구조','구조'), mtag('교사 준비','준비'), mtag('실행 전략','실행')], 'graph':mgraph('수업 설계', ('원리','설계 원리'), ('운영','수업 구조'), ('준비','교사 준비'))},
        {'match': r'프롬프트|질문', 'summary':['질문을 설계하고 조건을 조정해 원하는 출력을 얻는 방법을 다룹니다.'], 'tags':[mtag('프롬프트 설계','프롬프트'), mtag('질문 전략','질문'), mtag('출력 조정','출력'), mtag('반복 개선','개선')], 'graph':mgraph('질문 설계', ('입력','프롬프트'), ('조정','조건 설정'), ('개선','반복 개선'))},
        {'match': r'제로샷|원샷|퓨샷', 'summary':['예시를 얼마나 제공하느냐에 따라 AI 출력이 어떻게 달라지는지 비교합니다.'], 'tags':[mtag('예시 기반 질문','예시'), mtag('입력 전략','입력'), mtag('출력 비교','출력'), mtag('실험 설계','실험')], 'graph':mgraph('입력 전략 비교', ('방식','제로샷'), ('확장','원샷'), ('정교화','퓨샷'))},
        {'match': r'진짜일까|가짜일까|판단하자|검토', 'summary':['AI 답변의 사실성과 근거를 확인하며 비판적으로 검토하는 활동입니다.'], 'tags':[mtag('사실 검증','검증'), mtag('출처 확인','출처'), mtag('비판적 읽기','비판'), mtag('오류 점검','오류')], 'graph':mgraph('비판적 검토', ('대상','주장'), ('근거','출처 확인'), ('판단','사실 검증'))},
        {'match': r'평가단|최선일까요|다시쓰기', 'summary':['AI 결과를 평가하고 다시 쓰며 품질을 끌어올리는 과정에 초점을 둡니다.'], 'tags':[mtag('결과 평가','평가'), mtag('품질 개선','개선'), mtag('피드백','피드백'), mtag('재작성','다시쓰기')], 'graph':mgraph('출력 개선', ('평가','결과 평가'), ('조정','피드백'), ('산출','재작성'))},
        {'match': r'어때요, 참 쉽죠', 'summary':['시각 프롬프트를 조정하며 이미지 생성 결과를 비교하는 활동입니다.'], 'tags':[mtag('이미지 생성','이미지'), mtag('시각 프롬프트','프롬프트'), mtag('결과 비교','비교'), mtag('묘사 조정','묘사')], 'graph':mgraph('시각 표현 실험', ('도구','이미지 생성'), ('조정','시각 프롬프트'), ('확인','결과 비교'))},
        {'match': r'같은 내용, 다른 표현|말투|글쓰기 형식', 'summary':['목적과 독자에 맞게 표현 방식과 말투, 형식을 조정하는 활동입니다.'], 'tags':[mtag('표현 조정','표현'), mtag('형식 선택','형식'), mtag('말투 설계','말투'), mtag('독자 고려','독자')], 'graph':mgraph('표현 설계', ('대상','독자 고려'), ('선택','형식 선택'), ('조정','말투 설계'))},
        {'match': r'넌 이제 내 거야', 'summary':['원하는 기준과 말투를 유지하도록 AI 응답을 개인화하고 재사용하는 활동입니다.'], 'tags':[mtag('응답 개인화','개인화'), mtag('말투 설정','말투'), mtag('지시 유지','기준'), mtag('재사용 프롬프트','재사용')], 'graph':mgraph('개인화 설계', ('기준','지시 유지'), ('조정','말투 설정'), ('확장','재사용 프롬프트'))},
        {'match': r'한 번 더 생각하고 물어보자|토론해 보자', 'summary':['추가 질문과 대화를 통해 답변을 확장하고 사고를 깊게 만드는 활동입니다.'], 'tags':[mtag('추가 질문','질문'), mtag('대화 확장','대화'), mtag('사고 심화','사고'), mtag('재질문','재질문')], 'graph':mgraph('대화 확장', ('출발','추가 질문'), ('상호작용','대화 확장'), ('결과','사고 심화'))},
        {'match': r'내 말 좀 들어봐', 'summary':['자신의 생각을 말이나 글로 풀어내며 AI와 대화를 시작하는 활동입니다.'], 'tags':[mtag('생각 표현','표현'), mtag('대화 시작','대화'), mtag('구술 초안','말하기'), mtag('피드백 대화','피드백')], 'graph':mgraph('생각 꺼내기', ('표현','생각 표현'), ('상호작용','대화 시작'), ('정리','피드백 대화'))},
        {'match': r'나도 한 번 써 볼게', 'summary':['AI 답변을 바탕으로 직접 초안을 쓰고 수정하는 활동입니다.'], 'tags':[mtag('직접 쓰기','쓰기'), mtag('초안 작성','초안'), mtag('수정 보완','수정'), mtag('AI 피드백','피드백')], 'graph':mgraph('초안 쓰기', ('출발','직접 쓰기'), ('지원','AI 피드백'), ('개선','수정 보완'))},
        {'match': r'오늘 나의 일정이 어떻게 되지', 'summary':['AI를 계획 파트너로 활용해 일정과 할 일을 정리하는 활동입니다.'], 'tags':[mtag('일정 계획','일정'), mtag('할 일 관리','할 일'), mtag('우선순위','우선순위'), mtag('생활 적용','생활')], 'graph':mgraph('계획 세우기', ('정리','일정 계획'), ('선택','우선순위'), ('적용','생활 적용'))},
        {'match': r'역할을 설정하자|선생님이고, 너는 학생이야|오늘은 내가 AI의 선생님', 'summary':['AI에게 역할과 맥락을 부여해 보다 적절한 상호작용을 만드는 활동입니다.'], 'tags':[mtag('역할 부여','역할'), mtag('맥락 설정','맥락'), mtag('대화 시나리오','대화'), mtag('상호작용','상호작용')], 'graph':mgraph('역할 기반 상호작용', ('설정','역할 부여'), ('상황','맥락 설정'), ('대화','상호작용'))},
        {'match': r'안전|책임|윤리', 'summary':['AI 사용의 책임과 안전, 가치 판단을 함께 성찰하는 활동입니다.'], 'tags':[mtag('가치 성찰','가치'), mtag('안전 사용','안전'), mtag('책임','책임'), mtag('윤리','윤리')], 'graph':mgraph('가치와 책임', ('기준','안전 사용'), ('태도','책임'), ('성찰','윤리'))},
        {'match': r'만들기|제작하기|개발하기|개발', 'summary':['AI를 활용해 결과물을 공동 제작하거나 문제 해결 산출물을 만드는 활동입니다.'], 'tags':[mtag('산출물 제작','만들기'), mtag('AI 협력','AI','협력'), mtag('문제 해결','문제'), mtag('공동 창작','창작')], 'graph':mgraph('제작 활동', ('도구','AI 협력'), ('과정','문제 해결'), ('결과','산출물 제작'))},
        {'match': r'소개$', 'summary':['활동에 쓰일 도구의 핵심 기능과 수업 적용 포인트를 소개합니다.'], 'tags':[mtag('도구 이해','도구'), mtag('핵심 기능','기능'), mtag('수업 적용','수업'), mtag('준비 단계','준비')], 'graph':mgraph('도구 소개', ('기능','핵심 기능'), ('맥락','수업 적용'), ('준비','준비 단계'))},
    ],
    'secondary-workbook': [],
    'elementary-main': [
        {'match': r'^머리말$', 'summary':['책의 문제의식과 교실 적용 방향을 여는 서문입니다.'], 'tags':[mtag('문제의식','문제의식'), mtag('교실 변화','교실'), mtag('AI 협력','AI','협력'), mtag('수업 방향','수업')], 'graph':mgraph('수업의 출발점', ('배경','교실 변화'), ('관계','AI 협력'), ('방향','수업 방향')), 'sparse':True},
        {'match': r'^목차$', 'summary':['이론, 활동, 교과 수업, 학생용 워크북이 어떻게 연결되는지 보여주는 안내입니다.'], 'tags':[mtag('전체 구조','구조'), mtag('활동 흐름','활동'), mtag('교과 수업','교과'), mtag('워크북','워크북')], 'graph':mgraph('책의 구성', ('이론','도입'), ('실습','활동'), ('적용','교과 수업')), 'sparse':True},
        {'match': r'도입|첫걸음', 'summary':['초등 교실에서 AI 협력 수업을 시작하는 배경과 관점을 정리합니다.'], 'tags':[mtag('도입 맥락','도입'), mtag('AI 협력','AI','협력'), mtag('초등 수업','초등'), mtag('학습 관점','학습')], 'graph':mgraph('초등 AI 협력의 출발', ('배경','교육 변화'), ('관점','AI 협력'), ('실천','초등 수업'))},
        {'match': r'파트너로 보는 새로운 학습 패러다임', 'summary':['AI를 파트너로 보는 관점에서 학습 구조와 역할을 다시 설계하는 내용을 다룹니다.'], 'tags':[mtag('AI 파트너','파트너'), mtag('학습 패러다임','패러다임'), mtag('협력 관점','협력'), mtag('역할 재구성','역할')], 'graph':mgraph('협력 관점', ('관점','AI 파트너'), ('구조','학습 패러다임'), ('실천','역할 재구성'))},
        {'match': r'AI교육2\.0과 AI협력 교육', 'summary':['초등 맥락에서 AI교육 2.0과 AI 협력 교육의 방향을 연결합니다.'], 'tags':[mtag('AI교육 2.0','AI교육 2.0'), mtag('협력 교육','협력 교육'), mtag('수업 전환','수업'), mtag('초등 적용','초등')], 'graph':mgraph('초등 적용 방향', ('모형','AI교육 2.0'), ('실천','협력 교육'), ('현장','초등 적용'))},
        {'match': r'역할 분담의 교육적 가치', 'summary':['인간과 AI가 역할을 나눌 때 생기는 교육적 가치와 책임을 설명합니다.'], 'tags':[mtag('역할 분담','역할'), mtag('인간-AI 협력','인간-AI'), mtag('교육적 가치','가치'), mtag('책임 공유','책임')], 'graph':mgraph('역할 분담의 가치', ('구조','역할 분담'), ('관계','인간-AI 협력'), ('가치','교육적 가치'))},
        {'match': r'사고가 오가는 수업의 구조', 'summary':['질문과 응답, 피드백이 오가는 상호작용 중심 수업 구조를 제시합니다.'], 'tags':[mtag('수업 구조','구조'), mtag('질문 흐름','질문'), mtag('사고 교류','사고'), mtag('상호작용','상호작용')], 'graph':mgraph('사고 흐름 설계', ('시작','질문 흐름'), ('교류','사고 교류'), ('운영','수업 구조'))},
        {'match': r'교사의 준비 - 기술보다 태도', 'summary':['기술 숙련도보다 교사의 태도와 수업 운영 감각이 더 중요하다는 점을 강조합니다.'], 'tags':[mtag('교사 준비','교사'), mtag('태도','태도'), mtag('수업 설계','설계'), mtag('학습 지원','지원')], 'graph':mgraph('교사의 준비', ('기준','태도'), ('실천','수업 설계'), ('지원','학습 지원'))},
        {'match': r'프롬프트|질문', 'summary':['학생이 질문을 설계하고 AI 출력을 조정하는 기초 활동입니다.'], 'tags':[mtag('프롬프트 설계','프롬프트'), mtag('질문 전략','질문'), mtag('출력 조정','출력'), mtag('반복 개선','개선')], 'graph':mgraph('질문 설계', ('입력','프롬프트'), ('조정','조건 설정'), ('개선','반복 개선'))},
        {'match': r'글쓰기 형식', 'summary':['글의 형식과 목적에 맞게 AI 출력 방식을 선택하는 활동입니다.'], 'tags':[mtag('글쓰기 형식','형식'), mtag('표현 선택','표현'), mtag('독자 고려','독자'), mtag('출력 조정','출력')], 'graph':mgraph('형식 선택', ('기준','글쓰기 형식'), ('대상','독자 고려'), ('조정','출력 조정'))},
        {'match': r'말투를 조정', 'summary':['상황과 독자에 맞게 AI의 말투와 표현을 조정하는 활동입니다.'], 'tags':[mtag('말투 조정','말투'), mtag('표현 조율','표현'), mtag('독자 고려','독자'), mtag('응답 수정','수정')], 'graph':mgraph('말투 조정', ('기준','독자 고려'), ('선택','표현 조율'), ('수정','응답 수정'))},
        {'match': r'그린 그림', 'summary':['AI 이미지와 사람이 그린 그림을 비교하며 표현과 해석을 확장하는 활동입니다.'], 'tags':[mtag('이미지 생성','이미지'), mtag('시각 비교','비교'), mtag('표현 해석','해석'), mtag('창작 대화','창작')], 'graph':mgraph('그림 비교 활동', ('출발','이미지 생성'), ('비교','시각 비교'), ('확장','표현 해석'))},
        {'match': r'진짜일까|가짜일까|평가단', 'summary':['AI 답변의 타당성과 근거를 살피며 비판적으로 검토하는 활동입니다.'], 'tags':[mtag('사실 검증','검증'), mtag('근거 확인','근거'), mtag('비판적 검토','비판'), mtag('오류 점검','오류')], 'graph':mgraph('비판적 검토', ('대상','주장'), ('근거','근거 확인'), ('판단','사실 검증'))},
        {'match': r'AI와 토론해 보자', 'summary':['AI와 의견을 주고받으며 주장과 근거를 정교하게 만드는 활동입니다.'], 'tags':[mtag('토론','토론'), mtag('주장 근거','근거'), mtag('반론','반론'), mtag('사고 확장','사고')], 'graph':mgraph('토론 활동', ('주장','토론'), ('근거','주장 근거'), ('확장','사고 확장'))},
        {'match': r'상상하기|다시쓰기|챗봇|주제가|뉴스|지도|퀴즈|영상|웹페이지|앱|보드게임|ID 카드', 'summary':['AI와 함께 아이디어를 확장하고 결과물을 만드는 창작 중심 활동입니다.'], 'tags':[mtag('공동 창작','창작'), mtag('AI 협력','AI','협력'), mtag('문제 해결','문제'), mtag('산출물 제작','산출물')], 'graph':mgraph('창작 활동', ('아이디어','공동 창작'), ('과정','AI 협력'), ('결과','산출물 제작'))},
        {'match': r'역할을 설정하자|선생님', 'summary':['역할과 상황을 정해 AI와의 대화를 구체화하는 활동입니다.'], 'tags':[mtag('역할 부여','역할'), mtag('맥락 설정','맥락'), mtag('대화 시나리오','대화'), mtag('상호작용','상호작용')], 'graph':mgraph('역할 기반 상호작용', ('설정','역할 부여'), ('상황','맥락 설정'), ('대화','상호작용'))},
        {'match': r'안전|책임|윤리', 'summary':['안전하고 책임 있는 AI 사용과 공동 창작의 가치를 성찰합니다.'], 'tags':[mtag('안전 사용','안전'), mtag('책임','책임'), mtag('윤리','윤리'), mtag('가치 성찰','가치')], 'graph':mgraph('안전과 가치', ('기준','안전 사용'), ('태도','책임'), ('성찰','가치 성찰'))},
    ],
    'elementary-workbook': [],
}
REPORT_PATTERNS['secondary-workbook'] = REPORT_PATTERNS['secondary-main']
REPORT_PATTERNS['elementary-workbook'] = REPORT_PATTERNS['elementary-main']
TITLE_LEXICON = {
    'ko': [
        ('국어', mtag('국어', '국어')),
        ('영어', mtag('영어', '영어')),
        ('과학', mtag('과학', '과학')),
        ('사회', mtag('사회', '사회')),
        ('음악', mtag('음악', '음악')),
        ('정보', mtag('정보', '정보')),
        ('수학', mtag('수학', '수학')),
        ('미술', mtag('미술', '미술')),
        ('체육', mtag('체육', '체육')),
        ('창체', mtag('창체', '창체')),
        ('E-book', mtag('전자책', 'E-book', 'Book Creator')),
        ('Book Creator', mtag('전자책', 'Book Creator', 'E-book')),
        ('Clipchamp', mtag('영상 제작', 'Clipchamp', '동영상')),
        ('Canva', mtag('디자인 도구', 'Canva')),
        ('PlayingCard.io', mtag('보드게임', 'PlayingCard.io', '보드게임')),
        ('BandLab', mtag('음악 창작', 'BandLab', '음악')),
        ('앱 인벤터', mtag('앱 개발', '앱 인벤터', '앱')),
        ('앱 개발', mtag('앱 개발', '앱', '개발')),
        ('웹페이지', mtag('웹페이지 제작', '웹페이지')),
        ('지도', mtag('지도 제작', '지도')),
        ('뉴스', mtag('뉴스 제작', '뉴스')),
        ('영상', mtag('영상 제작', '영상')),
        ('퀴즈', mtag('퀴즈 제작', '퀴즈')),
        ('주제가', mtag('노래 만들기', '주제가')),
        ('챗봇', mtag('챗봇 제작', '챗봇')),
        ('토론', mtag('토론 활동', '토론')),
        ('안전', mtag('안전 사용', '안전')),
        ('책임', mtag('책임 있는 활용', '책임')),
        ('윤리', mtag('윤리 성찰', '윤리')),
    ],
    'en': [
        ('Digitacy', mtag('Digitacy', 'Digitacy')),
        ('AI Thinking', mtag('AI Thinking', 'AI Thinking')),
        ('AGI', mtag('AGI', 'AGI')),
        ('ASI', mtag('ASI', 'ASI')),
        ('collaborate', mtag('Collaboration', 'collaborate', 'collaboration')),
    ],
}
KEYS_KO = [('digitacy','Digitacy','AI기본사회에서 살아가기 위한 디지털 기초 역량입니다.',[30,31]),('ai-thinking','AI Thinking','추상화, 자동화, 자율화를 중심으로 인간과 AI가 함께 문제를 해결하는 사고 체계입니다.',[39,40]),('ai-understanding','AI 이해교육','데이터, 알고리즘, 모델의 작동 원리와 한계를 이해하게 하는 교육 영역입니다.',[50,51]),('ai-collaboration','AI 협력교육','AI를 협력 파트너로 보고 공동 문제 해결 구조를 설계하게 하는 교육입니다.',[53,54]),('ai-value','AI 가치교육','AI 시대에 어떤 방향의 사회를 만들 것인지 묻는 가치 중심 교육입니다.',[59,60]),('meta-cooperationism','메타협력주의','인간-AI 상호작용을 전제로 학습 관계를 다시 설계하는 핵심 개념입니다.',[27,28])]
KEYS_EN = [('digitacy','Digitacy','A foundational capability for life in an AI-based society.',[16,17]),('ai-thinking','AI Thinking','A human-AI collaborative thinking system centered on abstraction, automation, intelligence, and autonomy.',[20,21]),('ai-understanding','AI Understanding Education','An educational area focused on understanding AI systems and their limits.',[26,27]),('ai-collaboration','AI Collaborative Education','An educational area that treats AI as a collaborative entity.',[28,29]),('ai-value','AI Value Education','An educational area that moves beyond rules toward questions of value and direction.',[30,31]),('meta-cooperationism','Metacooperationism','A learning-theory frame built around ongoing human-AI interaction.',[14,15])]

REPORTS = [
    {'key':'main-en','group':'main','main':'main-en','out':SITE_DIR,'pdf':MAIN_EN_PDF,'asset':'main-en','lang':'en','html_lang':'en','mark':'AI 2.0','brand':'AI Education 2.0 Archive','subbrand':'English report viewer','eyebrow':'2025 Policy Research Report','title':'Designing the Future of','subtitle':'AI Education 2.0','strap':'AI Basic Society: A Major Transformation in Education','desc':'This page reconstructs the translated report as a sectioned website so the entire volume can be read in order.','meta':[('Source','English translation PDF'),('Publisher','Korean Society for AI Education'),('Issued','August 2025')],'sections':MAIN_EN,'keys':KEYS_EN,'lang_switch':'en','pdf_label':'Open translation PDF','footer':'The translated source pages remain attached to every section so the full report can be reviewed without omission.'},
    {'key':'main-ko','group':'main','main':'main-ko','out':KO_DIR,'pdf':MAIN_KO_PDF,'asset':'main-ko','lang':'ko','html_lang':'ko','mark':'AI 2.0','brand':'AI교육 2.0 아카이브','subbrand':'한국어 원문 보고서','eyebrow':'한국AI교육학회 2025 정책연구보고서','title':'AI교육 2.0','subtitle':'미래를 설계하다','strap':'AI기본사회, 교육의 대전환','desc':'압축된 보고서를 목차 기준으로 다시 풀어 원문 페이지를 빠짐없이 연결했습니다.','meta':[('원문','한국어 보고서'),('발행처','한국인공지능교육학회'),('발행일','2025년 8월')],'sections':MAIN_KO,'keys':KEYS_KO,'lang_switch':'ko','pdf_label':'원문 PDF 열기','footer':'각 카드에 원문 페이지를 그대로 붙여 표, 그림, 쪽배치까지 포함해 전체를 확인할 수 있게 했습니다.'},
    {'key':'secondary-main','group':'secondary-main','main':'main-ko','out':REPORTS_DIR / 'secondary-main','pdf':SECONDARY_MAIN_PDF,'asset':'secondary-main','lang':'ko','html_lang':'ko','mark':'중등','brand':'생성형 AI, 교실 속 협력 파트너','subbrand':'중등편 본문','eyebrow':'중등편 본문','title':'생성형 AI,','subtitle':'교실 속 협력 파트너','strap':'중학교 교실을 위한 본문형 가이드','desc':'중등편 본문 전체를 목차 흐름대로 다시 묶었습니다.','meta':[('형태','인쇄용 본문 PDF'),('발행처','연두에디션'),('발행일','2026년 2월 28일')],'sections':SECONDARY_MAIN,'keys':[],'lang_switch':'ko-disabled','pdf_label':'원문 PDF 열기','footer':'본문 전 페이지를 항목별 카드에 다시 배치해 필요한 수업 사례로 바로 이동할 수 있게 했습니다.'},
    {'key':'secondary-workbook','group':'secondary-workbook','main':'main-ko','out':REPORTS_DIR / 'secondary-workbook','pdf':SECONDARY_WORKBOOK_PDF,'asset':'secondary-workbook','lang':'ko','html_lang':'ko','mark':'중등W','brand':'생성형 AI, 교실 속 협력 파트너','subbrand':'중등편 워크북','eyebrow':'중등편 워크북','title':'활동지로 바로 보는','subtitle':'중등 AI 협력 수업','strap':'차시별 워크시트와 교과 활동 모음','desc':'중등편 워크북을 활동 단위로 다시 묶었습니다.','meta':[('형태','인쇄용 워크북 PDF'),('발행처','연두에디션'),('발행일','2026년 2월 28일')],'sections':SECONDARY_WORKBOOK,'keys':[],'lang_switch':'ko-disabled','pdf_label':'원문 PDF 열기','footer':'워크북 전 페이지를 주제별로 다시 묶어 필요한 활동지만 빠르게 찾아볼 수 있게 했습니다.'},
    {'key':'elementary-main','group':'elementary-main','main':'main-ko','out':REPORTS_DIR / 'elementary-main','pdf':ELEMENTARY_MAIN_PDF,'asset':'elementary-main','lang':'ko','html_lang':'ko','mark':'초등','brand':'생성형 AI, 교실 속 협력 파트너','subbrand':'초등편 본문','eyebrow':'초등편 본문','title':'초등 교실을 위한','subtitle':'AI 협력 수업 설계','strap':'이론, 활동, 교과 사례, 학생용 워크북까지 한 권으로 정리','desc':'초등편 본문을 섹션별로 다시 잘라 바로 탐색할 수 있게 만들었습니다.','meta':[('형태','인쇄용 본문 PDF'),('발행처','연두에디션'),('발행일','2026년 2월 28일')],'sections':ELEMENTARY_MAIN,'keys':[],'lang_switch':'ko-disabled','pdf_label':'원문 PDF 열기','footer':'본문과 뒤쪽 학생용 워크북까지 모두 포함해 전체 분량을 메뉴 기반으로 탐색할 수 있게 했습니다.'},
    {'key':'elementary-workbook','group':'elementary-workbook','main':'main-ko','out':REPORTS_DIR / 'elementary-workbook','pdf':ELEMENTARY_WORKBOOK_PDF,'asset':'elementary-workbook','lang':'ko','html_lang':'ko','mark':'초등W','brand':'생성형 AI, 교실 속 협력 파트너','subbrand':'초등편 워크북','eyebrow':'초등편 워크북','title':'활동으로 바로 쓰는','subtitle':'초등 AI 워크북','strap':'질문, 검토, 확장, 성찰 활동 묶음','desc':'초등편 워크북을 활동 흐름에 맞춰 다시 묶었습니다.','meta':[('형태','인쇄용 워크북 PDF'),('발행처','연두에디션'),('발행일','2026년 2월 28일')],'sections':ELEMENTARY_WORKBOOK,'keys':[],'lang_switch':'ko-disabled','pdf_label':'원문 PDF 열기','footer':'워크북 전 페이지를 활동 단위로 다시 배치해 수업 준비와 현장 활용에 바로 쓸 수 있게 했습니다.'},
]
TARGETS = {'main-en':SITE_DIR / 'index.html','main-ko':KO_DIR / 'index.html','secondary-main':REPORTS_DIR / 'secondary-main' / 'index.html','secondary-workbook':REPORTS_DIR / 'secondary-workbook' / 'index.html','elementary-main':REPORTS_DIR / 'elementary-main' / 'index.html','elementary-workbook':REPORTS_DIR / 'elementary-workbook' / 'index.html'}
STOPWORDS_KO = {'그리고','그러나','또한','대한','위한','에서','으로','하는','하다','있는','있다','하게','한다','통해','기반','교육','학습','활동','내용','과정','방법','중심','구조','설계','활용','생성형','교실','학생','교사','초등','중등','본문','워크북','차시','무엇인가','소개','안내','개요','기본','세부','내용','이유','필요성','대상','목표','첫걸음','머리말','목차','표지','정보','발행','보고서','문제','제기','연구','서문','있습니다','이러한','이제','전체','구성','범위','합니다','넘어','새로운'}
STOPWORDS_EN = {'the','and','for','with','that','this','from','into','over','about','their','they','through','using','used','what','when','where','which','page','pages','report','education','learning','model','students','teachers','basic','details','introduction','references','cover','index','goals','targets','publication','information','overview','guide','why','does','need','main','workbook','we','our','are','can','than','rather','must','start','new','future','designed','properly','research','foundation','definition','terms','key','it','beyond','mind','ability'}

def rel(from_dir: Path, to_path: Path) -> str: return os.path.relpath(to_path, from_dir).replace('\\','/')
def page_name(n: int) -> str: return f'page-{n:03d}.webp'
def fmt_range(a: int, b: int) -> str: return f'PDF {a}' if a == b else f'PDF {a}-{b}'
def fmt_count(lang: str, a: int, b: int) -> str: c = b - a + 1; return f'{c}쪽' if lang == 'ko' else (f'{c} page' if c == 1 else f'{c} pages')

def unique(path: Path) -> Path:
    if not path.exists(): return path
    for i in range(1,1000):
        c = path.with_name(f'{path.name}-{i}')
        if not c.exists(): return c
    raise RuntimeError(path)

def move_if_exists(src: Path, dst: Path) -> None:
    if src.exists():
        dst = unique(dst); dst.parent.mkdir(parents=True, exist_ok=True); shutil.move(str(src), str(dst))

def clean(path: Path) -> None:
    if not path.exists(): return
    shutil.rmtree(path) if path.is_dir() else path.unlink()

def archive_legacy() -> None:
    root = OLD_DIR / 'homepage-legacy'; root.mkdir(parents=True, exist_ok=True)
    if (SITE_DIR / 'assets' / 'report-pages').exists() or (SITE_DIR / 'assets' / 'report-source.pdf').exists(): move_if_exists(SITE_DIR / 'assets', root / 'aied-web' / 'assets')
    if (SITE_DIR / 'index.html').exists() and not (SITE_DIR / 'report.js').exists(): move_if_exists(SITE_DIR / 'index.html', root / 'aied-web' / 'index.html')
    for name in LEGACY_SITE_ITEMS: move_if_exists(SITE_DIR / name, root / 'aied-web' / name)
    for name in LEGACY_ROOT_ITEMS: move_if_exists(WORKSPACE_DIR / name, root / name)

def normalize(text: str, lang: str) -> str:
    text = text.replace('\uf0b7', ' ').replace('ÿ', ' ').replace('\ufffd', ' ').replace('\xa0', ' ').replace('\u3000', ' ')
    if lang == 'en':
        text = text.replace('A I', 'AI')
        for _ in range(4):
            text = re.sub(r'\b([A-Za-z]) ([a-z]{2,})\b', r'\1\2', text)
            text = re.sub(r'\b([A-Z]) ([A-Z])\b', r'\1\2', text)
    for _ in range(4):
        text = re.sub(r'([A-Z가-힣])\1([A-Z가-힣])\2', r'\1\2', text)
        text = re.sub(r'([A-Z가-힣])\s+\1\s*([A-Z가-힣])\s+\2', r'\1\2', text)
    text = re.sub(r'^[.·•:▶▷▸►※]+\s*', '', text, flags=re.M)
    text = re.sub(r'[ \t]+', ' ', text)
    return re.sub(r'\n{3,}', '\n\n', text).strip()

def clean_line(raw: str) -> str:
    line = re.sub(r'^(?:[0-9]+|[①-⑳]|\[[^\]]+\]|<[^>]+>|※)\s*', '', raw.strip())
    line = re.sub(r'^[.·•:▶▷▸►※]+\s*', '', line)
    return re.sub(r'\s+', ' ', line).strip(' |')

def skip(line: str, lang: str) -> bool:
    s = line.strip(' |·•-—–\t')
    if not s or len(s) <= 2 or re.fullmatch(r'[0-9IVXLCM.()/? ]+', s):
        return True
    return s in (NOISE_KO if lang == 'ko' else NOISE_EN)

def collect_units(texts: list[str], lang: str) -> list[str]:
    units, seen, buf = [], set(), ''
    for text in texts:
        for raw in text.splitlines():
            line = clean_line(raw)
            if skip(line, lang) or len(line) < 8:
                continue
            if line in seen:
                continue
            seen.add(line)
            buf = f'{buf} {line}'.strip() if buf else line
            if line.endswith(('.', '!', '?', ':', '다.', '요.', '니다.', '합니다.')) or len(buf) >= 120:
                units.append(buf)
                buf = ''
    if buf:
        units.append(buf)
    return units

def tokenize(text: str, lang: str) -> list[str]:
    tokens = re.findall(r'[A-Za-z가-힣][A-Za-z가-힣0-9+.-]{1,24}', text)
    stop = STOPWORDS_EN if lang == 'en' else STOPWORDS_KO
    cleaned = []
    for token in tokens:
        token = token.strip('.-+')
        if lang == 'ko':
            if re.search(r'[A-Za-z0-9]', token):
                for suffix in ('으로', '에서', '에게', '에서의', '이다', '이다.', '들은', '에는', '와의', '과의'):
                    if token.endswith(suffix) and len(token) > len(suffix) + 1:
                        token = token[:-len(suffix)]
                        break
                if len(token) > 2 and token[-1] in '은는이가을를의와과도만':
                    token = token[:-1]
        lower = token.lower()
        if lower in stop or token in stop:
            continue
        if lang == 'en' and len(token) <= 3 and token != token.upper():
            continue
        if len(token) <= 1:
            continue
        cleaned.append(token)
    return cleaned

def term_key(token: str) -> str:
    return re.sub(r'[^a-z0-9가-힣]+', '', token.lower())

def polish_tag_label(label: str, lang: str) -> str:
    label = re.sub(r'^[#▶▷▸►]+', '', label).strip(' .,:;!?')
    if lang == 'ko':
        for suffix, replacement in [('에서',''), ('에게',''), ('으로',''), ('와',''), ('과','')]:
            if label.endswith(suffix) and len(label) > len(suffix) + 1:
                label = label[:-len(suffix)] + replacement
                break
        rewrites = {'살아남': '살아남기', '협력하': '협력하기', '생각하': '생각하기', '질문하': '질문하기'}
        label = rewrites.get(label, label)
    return label.strip()

def normalize_tag_specs(entries: list[object], lang: str) -> list[dict[str, object]]:
    tags, seen = [], set()
    for entry in entries:
        if isinstance(entry, dict):
            label = str(entry.get('label', ''))
            queries = [str(query) for query in entry.get('queries', [])] or [label]
        else:
            label = str(entry)
            queries = [label]
        label = polish_tag_label(label, lang)
        key = term_key(label)
        if not label or not key or key in seen:
            continue
        seen.add(key)
        tags.append({'label': label, 'queries': [query for query in queries if query] or [label]})
    return tags

def normalize_graph_spec(graph: dict[str, object] | None, title: str, tags: list[str], lang: str) -> dict[str, object]:
    base = graph or {}
    center = clean_line(str(base.get('center') or title)).strip(' .,:;!?') or title
    raw_nodes = base.get('nodes') or base.get('branches') or []
    seen = {term_key(center)}
    nodes = []
    for raw in raw_nodes:
        if isinstance(raw, dict):
            label = raw.get('label') or raw.get('term') or raw.get('name') or raw.get('value') or ''
            role = str(raw.get('role') or '').strip()
        elif isinstance(raw, (tuple, list)):
            label = raw[-1]
            role = str(raw[0]).strip() if len(raw) > 1 else ''
        else:
            label = raw
            role = ''
        label = polish_tag_label(str(label), lang)
        key = term_key(label)
        if not label or not key or key in seen:
            continue
        seen.add(key)
        nodes.append({'label': label, 'key': key, 'role': role})
    for tag in tags:
        label = polish_tag_label(tag, lang)
        key = term_key(label)
        if not label or not key or key in seen:
            continue
        seen.add(key)
        nodes.append({'label': label, 'key': key, 'role': ''})
        if len(nodes) >= 6:
            break
    if not nodes:
        label = '핵심 키워드' if lang == 'ko' else 'Key term'
        nodes = [{'label': label, 'key': term_key(label), 'role': ''}]
    return {'center': center, 'centerKey': term_key(center), 'nodes': nodes[:6], 'edges': list(base.get('edges', []))}

def attach_graph_keywords(graph: dict[str, object], tag_refs: list[dict[str, str]], lang: str) -> dict[str, object]:
    tag_map = {term_key(tag['label']): tag['id'] for tag in tag_refs}
    seen = set()
    nodes = []
    for raw in graph.get('nodes', []):
        label = polish_tag_label(str(raw.get('label') if isinstance(raw, dict) else raw), lang)
        key = term_key(label)
        if not label or not key or key in seen:
            continue
        seen.add(key)
        node = {'label': label, 'key': key}
        if isinstance(raw, dict):
            if raw.get('role'):
                node['role'] = str(raw['role'])
            if raw.get('weight'):
                node['weight'] = raw['weight']
        if key in tag_map:
            node['id'] = tag_map[key]
        nodes.append(node)
    for tag in tag_refs:
        key = term_key(tag['label'])
        if key in seen:
            continue
        seen.add(key)
        nodes.append({'label': tag['label'], 'id': tag['id'], 'key': key})
        if len(nodes) >= 6:
            break
    valid_keys = {node['key'] for node in nodes}
    edges = []
    for edge in graph.get('edges', []):
        source = term_key(str(edge.get('source', '')))
        target = term_key(str(edge.get('target', '')))
        if not target:
            continue
        if source and source != 'center' and source not in valid_keys:
            continue
        if target not in valid_keys:
            continue
        edges.append({
            'source': 'center' if source in {'', 'center', term_key(str(graph.get("center", "")))} else source,
            'target': target,
            'strength': str(edge.get('strength') or 'secondary'),
        })
    return {'center': graph.get('center', ''), 'centerKey': term_key(str(graph.get('center', ''))), 'nodes': nodes[:6], 'edges': edges}

def resolve_manual_entry(report_key: str, title: str) -> dict[str, object]:
    exact = dict(MANUAL_OVERRIDES.get(report_key, {}).get(title, {}))
    merged_tags = list(exact.get('tags', []))
    pattern_summary = None
    pattern_graph = None
    sparse = bool(exact.get('sparse'))
    for pattern in REPORT_PATTERNS.get(report_key, []):
        if not re.search(pattern['match'], title):
            continue
        merged_tags.extend(pattern.get('tags', []))
        if pattern_summary is None and pattern.get('summary'):
            pattern_summary = pattern['summary']
        if pattern_graph is None and pattern.get('graph'):
            pattern_graph = pattern['graph']
        sparse = sparse or pattern.get('sparse', False)
    if merged_tags:
        exact['tags'] = merged_tags
    if 'summary' not in exact and pattern_summary is not None:
        exact['summary'] = pattern_summary
    if 'graph' not in exact and pattern_graph is not None:
        exact['graph'] = pattern_graph
    if sparse:
        exact['sparse'] = True
    return exact

def curated_title_tags(title: str, report_key: str, lang: str) -> list[dict[str, object]]:
    tags = []
    for needle, tag in TITLE_LEXICON.get(lang, []):
        if needle in title:
            tags.append(tag)
    if lang == 'ko':
        if any(keyword in title for keyword in ('만들기', '제작하기', '개발하기', '개발')):
            tags.append(mtag('산출물 제작', '만들기', '제작', '개발'))
        if title.endswith('소개'):
            tags.append(mtag('도구 이해', '소개', '도구'))
        if 'AI' in title:
            tags.append(mtag('AI 협력', 'AI', '협력'))
    elif 'AI' in title:
        tags.append(mtag('AI', 'AI'))
    return normalize_tag_specs(tags, lang)

def trim_unit(text: str, limit: int = 150) -> str:
    text = clean_line(text).strip(' .;,:')
    text = re.sub(r'\b\d+\.\s+(?=[A-Z가-힣])', '', text)
    text = re.sub(r'\b((?:[A-Za-z가-힣0-9.+-]+\s+){2,6}[A-Za-z가-힣0-9.+-]+)\s+\1\b', r'\1', text)
    if not text:
        return ''
    if len(text) <= limit:
        return text if text.endswith(('.', '!', '?', '다.', '요.', '니다.', '합니다.')) else text + '.'
    cut_points = [text.rfind(mark, 0, limit) for mark in ['. ', '; ', ': ', ', ']]
    cut = max(cut_points)
    if cut < limit // 2:
        cut = limit
    clipped = text[:cut].rstrip(' ,;:')
    return clipped + ('...' if cut == limit else '.')

def rank_units(texts: list[str], lang: str) -> list[tuple[float, int, str, set[str]]]:
    units = collect_units(texts, lang)
    if not units:
        return []
    freq: dict[str, int] = {}
    for unit in units:
        for token in tokenize(unit, lang):
            key = term_key(token)
            if key:
                freq[key] = freq.get(key, 0) + 1
    ranked = []
    for idx, unit in enumerate(units):
        tokens = tokenize(unit, lang)
        token_set = {term_key(token) for token in tokens if term_key(token)}
        score = sum(freq.get(token, 0) for token in token_set) / max(len(token_set), 1)
        score += max(0, 3 - idx) * 0.25
        ranked.append((score, idx, unit, token_set))
    ranked.sort(key=lambda item: (-item[0], item[1]))
    return ranked

def compose_summary(title: str, tags: list[str], lang: str) -> str:
    focus = ', '.join(tags[:3])
    if lang == 'ko':
        if title == '문제 제기':
            return 'AI가 도구를 넘어 협력 주체가 되는 변화 속에서 교육이 다시 답해야 할 문제를 제기합니다.'
        if title in {'연구 서문', '머리말'}:
            return '보고서의 작성 배경과 문제의식을 짧게 밝히는 서문입니다.'
        if title == '목차':
            return '보고서 전체의 장과 절 흐름을 한눈에 파악할 수 있도록 구성 체계를 정리합니다.'
        if '참고문헌' in title:
            return '보고서의 주장과 모형이 기대는 선행연구와 참고 자료를 정리합니다.'
        return f"{title}에서 {focus}를 통해 핵심 주장과 교육적 함의를 압축해 설명합니다." if focus else f"{title}의 핵심 주장과 교육적 함의를 압축해 설명합니다."
    if title == 'Research Introduction':
        return 'Frames why education must respond differently as AI shifts from tool to collaborative partner.'
    if title == 'Index':
        return 'Maps the full report structure so the reader can move from principles to model components and detailed domains.'
    if 'References' in title:
        return 'Lists the studies and source materials that ground the report.'
    return f"Focuses on {focus} to explain the main claim and educational implications of {title}." if focus else f"Explains the main claim and educational implications of {title}."

def low_value_summary(summary: str, lang: str) -> bool:
    if len(tokenize(summary, lang)) < 3:
        return True
    ai20_en = re.search(r'AI\s*Education\s*2\s*\.0', summary)
    ai20_ko = re.search(r'AI\s*교육\s*2\s*\.0', summary) or re.search(r'AI교육\s*2\s*\.0', summary)
    if lang == 'en' and summary.startswith(('Core Principles of', 'Details of', 'Definition of', 'References')):
        return True
    if lang == 'en' and ai20_en and any(flag in summary for flag in ('Core Principles', 'Introduction', 'Model', 'Details')):
        return True
    if lang == 'ko' and summary.startswith(('AI교육 2.0 모델의 핵심 원칙', 'AI교육 2.0 모델의 구조', '참고문헌 안내')):
        return True
    if lang == 'ko' and ai20_ko and any(flag in summary for flag in ('모델의 핵심 원칙', 'AI교육 2.0의 소개', '목차', '참고문헌')):
        return True
    if lang == 'ko' and ('AI교육 2.0 모델의 핵심 원칙' in summary or 'AI 교육 2.0 모델의 핵심 원칙' in summary):
        return True
    return False

def preview(title: str, texts: list[str], lang: str, tags: list[str] | None = None, limit: int = 2) -> list[str]:
    ranked = rank_units(texts, lang)
    if not ranked:
        return []
    tags = tags or extract_tags(title, texts, lang)
    chosen = [compose_summary(title, tags, lang)]
    used = []
    for _, _, unit, token_set in ranked:
        if any(len(token_set & other) >= max(1, min(len(token_set), len(other)) // 2) for other in used if other):
            continue
        summary = trim_unit(unit, 170 if lang == 'en' else 140)
        if not summary or summary in chosen or low_value_summary(summary, lang):
            continue
        if tags and sum(1 for tag in tags if term_key(tag) and term_key(tag) in term_key(summary)) >= len(tags[:2]):
            continue
        chosen.append(summary)
        used.append(token_set)
        if len(chosen) >= limit:
            break
    return chosen[:limit]

def extract_tags(title: str, texts: list[str], lang: str, limit: int = 4) -> list[str]:
    title_tokens = tokenize(title, lang)
    scores: dict[str, float] = {}
    display: dict[str, str] = {}
    for unit in collect_units(texts, lang):
        unit_seen = set()
        for token in tokenize(unit, lang):
            key = term_key(token)
            if not key or key in unit_seen:
                continue
            scores[key] = scores.get(key, 0) + 1
            display.setdefault(key, token)
            unit_seen.add(key)
    for token in title_tokens:
        key = term_key(token)
        if key:
            scores[key] = scores.get(key, 0) + 1.75
            display[key] = token
    ranked, seen = [], set()
    for token in title_tokens:
        key = term_key(token)
        if not key or key in seen:
            continue
        if scores.get(key, 0) < 1.75:
            continue
        seen.add(key)
        ranked.append(polish_tag_label(display[key], lang))
        if len(ranked) >= limit:
            return ranked
    for key, _ in sorted(scores.items(), key=lambda item: (-item[1], -len(display[item[0]]), display[item[0]].lower())):
        if key in seen:
            continue
        seen.add(key)
        ranked.append(polish_tag_label(display[key], lang))
        if len(ranked) >= limit:
            break
    return [tag for tag in ranked if tag][:limit]

def graph_query_terms(label: str, lang: str) -> list[str]:
    tokens = tokenize(label, lang)
    keys = [term_key(token) for token in tokens if term_key(token)]
    direct = term_key(label)
    if direct and direct not in keys:
        keys.append(direct)
    return keys

def graph_units(texts: list[str], lang: str) -> list[set[str]]:
    units = []
    for unit in collect_units(texts, lang):
        token_set = {term_key(token) for token in tokenize(unit, lang) if term_key(token)}
        if token_set:
            units.append(token_set)
    return units

def graph_frequency(queries: list[str], units: list[set[str]]) -> int:
    if not queries:
        return 0
    return sum(1 for token_set in units if any(query in token_set or any(query in token for token in token_set) for query in queries))

def graph_cooccurrence(left: list[str], right: list[str], units: list[set[str]]) -> int:
    if not left or not right:
        return 0
    score = 0
    for token_set in units:
        left_hit = any(query in token_set or any(query in token for token in token_set) for query in left)
        right_hit = any(query in token_set or any(query in token for token in token_set) for query in right)
        if left_hit and right_hit:
            score += 1
    return score

def build_graph_network(graph_seed: dict[str, object], texts: list[str], tags: list[str], lang: str) -> dict[str, object]:
    units = graph_units(texts, lang)
    center = str(graph_seed.get('center') or '')
    center_queries = graph_query_terms(center, lang)
    candidates: list[dict[str, object]] = []
    seen = set()
    for raw in graph_seed.get('nodes', []):
        label = polish_tag_label(str(raw.get('label') if isinstance(raw, dict) else raw), lang)
        key = term_key(label)
        if not label or not key or key in seen:
            continue
        seen.add(key)
        role = str(raw.get('role') if isinstance(raw, dict) else '').strip()
        queries = graph_query_terms(label, lang)
        freq = graph_frequency(queries, units)
        weight = max(1, min(5, 1 + freq))
        candidates.append({'label': label, 'key': key, 'role': role, 'queries': queries, 'weight': weight})
    for tag in tags:
        label = polish_tag_label(tag, lang)
        key = term_key(label)
        if not label or not key or key in seen:
            continue
        seen.add(key)
        queries = graph_query_terms(label, lang)
        freq = graph_frequency(queries, units)
        candidates.append({'label': label, 'key': key, 'role': '', 'queries': queries, 'weight': max(1, min(5, 1 + freq))})
        if len(candidates) >= 6:
            break
    if not candidates:
        return graph_seed
    candidates.sort(key=lambda item: (-int(item['weight']), item['label']))
    nodes = candidates[:6]
    edges = [{'source': 'center', 'target': str(node['key']), 'strength': 'primary'} for node in nodes]
    pair_scores: list[tuple[int, int, int]] = []
    for idx, left in enumerate(nodes):
        for jdx in range(idx + 1, len(nodes)):
            right = nodes[jdx]
            score = graph_cooccurrence(left['queries'], right['queries'], units)
            if score <= 0 and center_queries:
                score = min(
                    graph_cooccurrence(center_queries, left['queries'], units),
                    graph_cooccurrence(center_queries, right['queries'], units),
                ) // 2
            if score > 0:
                pair_scores.append((score, idx, jdx))
    pair_scores.sort(key=lambda item: (-item[0], item[1], item[2]))
    for _, idx, jdx in pair_scores[:max(2, min(4, len(nodes) - 1))]:
        edges.append({'source': str(nodes[idx]['key']), 'target': str(nodes[jdx]['key']), 'strength': 'secondary'})
    return {'center': center, 'centerKey': term_key(center), 'nodes': nodes, 'edges': edges}

def graph_terms(title: str, tags: list[str], lang: str) -> dict[str, object]:
    center = title if len(title) <= 30 else title[:29].rstrip() + '...'
    labels = [tag for tag in tags if term_key(tag) != term_key(title)]
    return normalize_graph_spec({'center': center, 'nodes': labels}, title, tags, lang)

def keyword_hits(terms: str | list[str], page_texts: dict[int, str], start: int, end: int, lang: str, limit: int = 3) -> list[dict[str, str]]:
    hits = []
    needles = [term_key(str(term)) for term in ([terms] if isinstance(terms, str) else terms) if term_key(str(term))]
    for page in range(start, end + 1):
        for unit in collect_units([page_texts.get(page, '')], lang):
            unit_key = term_key(unit)
            if any(needle in unit_key for needle in needles):
                hits.append({'page': fmt_range(page, page), 'pageNumber': page, 'text': trim_unit(unit, 220)})
                break
        if len(hits) >= limit:
            break
    return hits

def load_texts(pdf_path: Path, pages: set[int], lang: str) -> dict[int, str]:
    result = {}
    with pdfplumber.open(pdf_path) as pdf:
        for p in sorted(pages):
            if 1 <= p <= len(pdf.pages): result[p] = normalize(pdf.pages[p-1].extract_text() or '', lang)
    return result

def render_pages(pdf_path: Path, out_dir: Path, count: int) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    if len(list(out_dir.glob('page-*.webp'))) == count: return
    doc = pdfium.PdfDocument(str(pdf_path))
    for i in range(len(doc)):
        n = i + 1; target = out_dir / page_name(n)
        if target.exists(): continue
        page = doc[i]; bmp = page.render(scale=1.8); img = bmp.to_pil().convert('RGB'); img.save(target, format='WEBP', quality=78, method=6); img.close()

WORKBOOK_SHARED_LABELS = {
    '학년/반': ('student_class', '학년/반'),
    '반': ('student_class', '반'),
    '번호': ('student_number', '번호'),
    '이름': ('student_name', '이름'),
}

def dedupe_numbers(values: list[float], gap: float = 1.2) -> list[float]:
    numbers = sorted(values)
    out: list[float] = []
    for value in numbers:
        if not out or abs(out[-1] - value) > gap:
            out.append(value)
    return out

def bbox_words(words: list[dict[str, object]], bbox: tuple[float, float, float, float], pad: float = 0.0) -> list[dict[str, object]]:
    x0, top, x1, bottom = bbox
    hits = []
    for word in words:
        cx = (float(word['x0']) + float(word['x1'])) / 2
        cy = (float(word['top']) + float(word['bottom'])) / 2
        if x0 - pad <= cx <= x1 + pad and top - pad <= cy <= bottom + pad:
            hits.append(word)
    hits.sort(key=lambda word: (round(float(word['top']), 1), float(word['x0'])))
    return hits

def bbox_text(words: list[dict[str, object]], bbox: tuple[float, float, float, float], pad: float = 0.0) -> str:
    return ' '.join(str(word['text']) for word in bbox_words(words, bbox, pad)).strip()

def field_kind(width: float, height: float) -> str:
    return 'textarea' if height >= 34 or (height >= 22 and width >= 180) else 'text'

def bbox_alpha_text(words: list[dict[str, object]], bbox: tuple[float, float, float, float], pad: float = 0.0) -> str:
    text = clean_line(bbox_text(words, bbox, pad))
    return re.sub(r'[^A-Za-z가-힣]+', '', text)

def bbox_has_meaningful_text(words: list[dict[str, object]], bbox: tuple[float, float, float, float], pad: float = 0.0, min_chars: int = 3) -> bool:
    return len(bbox_alpha_text(words, bbox, pad)) >= min_chars

def append_blank_field(
    fields: list[dict[str, object]],
    words: list[dict[str, object]],
    page_number: int,
    bbox: tuple[float, float, float, float],
    *,
    label: str = '',
    key: str = '',
    kind: str | None = None,
    pad: float = 1.0,
) -> None:
    x0, top, x1, bottom = bbox
    width = x1 - x0
    height = bottom - top
    if width < 36 or height < 16:
        return
    if bbox_has_meaningful_text(words, bbox, pad):
        return
    inset = min(6.0, max(2.0, min(width, height) * 0.08))
    trimmed = (x0 + inset, top + inset, x1 - inset, bottom - inset)
    if trimmed[2] - trimmed[0] < 24 or trimmed[3] - trimmed[1] < 12:
        return
    fields.append({
        'page': page_number,
        'bbox': trimmed,
        'kind': kind or field_kind(width, height),
        'label': label,
        'key': key,
    })

def horizontal_edges(page, min_length: float = 40.0) -> list[tuple[float, float, float]]:
    rows: dict[float, list[tuple[float, float]]] = {}
    for line in page.lines:
        top = float(line.get('top', 0))
        bottom = float(line.get('bottom', 0))
        x0 = float(line.get('x0', 0))
        x1 = float(line.get('x1', 0))
        if abs(top - bottom) >= 1.2 or (x1 - x0) < min_length:
            continue
        key = round(top, 1)
        rows.setdefault(key, []).append((x0, x1))
    merged: list[tuple[float, float, float]] = []
    for key, segments in rows.items():
        segments.sort()
        start, end = segments[0]
        for x0, x1 in segments[1:]:
            if x0 - end <= 3.0:
                end = max(end, x1)
            else:
                merged.append((start, key, end))
                start, end = x0, x1
        merged.append((start, key, end))
    merged.sort(key=lambda item: (item[1], item[0], item[2]))
    return merged

def vertical_edges(page, min_height: float = 18.0) -> list[tuple[float, float, float]]:
    cols: dict[float, list[tuple[float, float]]] = {}
    for line in page.lines:
        x0 = float(line.get('x0', 0))
        x1 = float(line.get('x1', 0))
        top = float(line.get('top', 0))
        bottom = float(line.get('bottom', 0))
        if abs(x0 - x1) >= 1.2 or (bottom - top) < min_height:
            continue
        key = round(x0, 1)
        cols.setdefault(key, []).append((top, bottom))
    merged: list[tuple[float, float, float]] = []
    for key, segments in cols.items():
        segments.sort()
        start, end = segments[0]
        for top, bottom in segments[1:]:
            if top - end <= 3.0:
                end = max(end, bottom)
            else:
                merged.append((key, start, end))
                start, end = top, bottom
        merged.append((key, start, end))
    merged.sort(key=lambda item: (item[0], item[1], item[2]))
    return merged

def detect_table_fields(
    page,
    words: list[dict[str, object]],
    page_number: int,
) -> list[dict[str, object]]:
    fields: list[dict[str, object]] = []
    for table in page.find_tables():
        x0, top, x1, bottom = table.bbox
        if (x1 - x0) > page.width * 0.92 and (bottom - top) > page.height * 0.88:
            continue
        cells = [cell for cell in table.cells if cell]
        if not cells:
            continue
        xs = dedupe_numbers([float(cell[0]) for cell in cells] + [float(cell[2]) for cell in cells])
        ys = dedupe_numbers([float(cell[1]) for cell in cells] + [float(cell[3]) for cell in cells])
        if len(xs) < 2 or len(ys) < 2:
            continue
        extracted = table.extract() or []
        for row_idx, row in enumerate(extracted):
            row = row or []
            for col_idx, cell in enumerate(row):
                text = clean_line(str(cell or '').replace('\n', ' '))
                if text in WORKBOOK_SHARED_LABELS and col_idx + 2 <= len(xs) - 1:
                    key, label = WORKBOOK_SHARED_LABELS[text]
                    bbox = (xs[col_idx + 1] + 4, ys[row_idx] + 4, xs[col_idx + 2] - 4, ys[row_idx + 1] - 4)
                    fields.append({'page': page_number, 'bbox': bbox, 'kind': 'text', 'label': label, 'key': key})
            merged_idx = next((idx for idx, cell in enumerate(row) if '반:' in str(cell or '') and '이름:' in str(cell or '')), None)
            if merged_idx is not None and merged_idx + 1 <= len(xs) - 1:
                cell_bbox = (xs[merged_idx], ys[row_idx], xs[merged_idx + 1], ys[row_idx + 1])
                label_words = [word for word in bbox_words(words, cell_bbox, 1.0) if clean_line(str(word['text'])).rstrip(':') in WORKBOOK_SHARED_LABELS]
                for idx, word in enumerate(label_words):
                    label_text = clean_line(str(word['text'])).rstrip(':')
                    key, label = WORKBOOK_SHARED_LABELS[label_text]
                    start = float(word['x1']) + 3
                    end = float(label_words[idx + 1]['x0']) - 3 if idx + 1 < len(label_words) else cell_bbox[2] - 4
                    if end - start >= 12:
                        fields.append({'page': page_number, 'bbox': (start, cell_bbox[1] + 4, end, cell_bbox[3] - 4), 'kind': 'text', 'label': label, 'key': key})
        cell_count = (len(xs) - 1) * (len(ys) - 1)
        if cell_count > 64:
            continue
        for yi in range(len(ys) - 1):
            for xi in range(len(xs) - 1):
                bbox = (xs[xi], ys[yi], xs[xi + 1], ys[yi + 1])
                width = bbox[2] - bbox[0]
                height = bbox[3] - bbox[1]
                if width < 36 or height < 16:
                    continue
                text = bbox_text(words, bbox, 1.0)
                if text:
                    continue
                inset = 4
                fields.append({
                    'page': page_number,
                    'bbox': (bbox[0] + inset, bbox[1] + inset, bbox[2] - inset, bbox[3] - inset),
                    'kind': field_kind(width, height),
                    'label': '',
                    'key': '',
                })
    return fields

def detect_prompt_line_fields(
    page,
    words: list[dict[str, object]],
    page_number: int,
) -> list[dict[str, object]]:
    fields: list[dict[str, object]] = []
    horizontal = [
        line for line in page.lines
        if abs(float(line.get('top', 0)) - float(line.get('bottom', 0))) < 1.0 and (float(line.get('x1', 0)) - float(line.get('x0', 0))) > 120
    ]
    small_rects = [
        rect for rect in page.rects
        if 48 <= float(rect.get('width', 0)) <= 180 and 18 <= float(rect.get('height', 0)) <= 42
    ]
    for rect in small_rects:
        rect_bbox = (float(rect['x0']), float(rect['top']), float(rect['x1']), float(rect['bottom']))
        label = bbox_text(words, rect_bbox, 1.0)
        if not label:
            continue
        top_lines = [line for line in horizontal if abs(float(line['top']) - rect_bbox[1]) < 1.6 and float(line['x1']) > rect_bbox[2] + 60]
        bottom_lines = [line for line in horizontal if abs(float(line['top']) - rect_bbox[3]) < 1.6 and float(line['x1']) > rect_bbox[2] + 60]
        if not top_lines or not bottom_lines:
            continue
        bbox = (
            rect_bbox[2] + 6,
            rect_bbox[1] + 4,
            max(max(float(line['x1']) for line in top_lines), max(float(line['x1']) for line in bottom_lines)) - 6,
            rect_bbox[3] - 4,
        )
        if bbox_text(words, bbox, 1.0):
            continue
        fields.append({'page': page_number, 'bbox': bbox, 'kind': 'text', 'label': label, 'key': ''})
    return fields

def detect_open_table_fields(
    page,
    words: list[dict[str, object]],
    page_number: int,
) -> list[dict[str, object]]:
    fields: list[dict[str, object]] = []
    horizontals = horizontal_edges(page, 70.0)
    verticals = vertical_edges(page, 18.0)
    for table in page.find_tables():
        x0, top, x1, bottom = [float(value) for value in table.bbox]
        if (x1 - x0) < 180 or (bottom - top) > 42:
            continue
        row_lines = [
            line for line in horizontals
            if abs(line[0] - x0) < 8 and abs(line[2] - x1) < 8 and bottom + 8 <= line[1] <= bottom + 260
        ]
        if not row_lines:
            continue
        separators = dedupe_numbers(
            [line[0] for line in verticals if x0 + 30 < line[0] < x1 - 24 and line[1] <= bottom + 2 and line[2] >= row_lines[-1][1] - 2],
            gap=2.0,
        )
        if not separators:
            continue
        row_bounds = dedupe_numbers([bottom] + [line[1] for line in row_lines], gap=1.6)
        col_bounds = [x0] + separators + [x1]
        for row_top, row_bottom in zip(row_bounds, row_bounds[1:]):
            if row_bottom - row_top < 18:
                continue
            for col_left, col_right in zip(col_bounds, col_bounds[1:]):
                if col_right - col_left < 42:
                    continue
                append_blank_field(fields, words, page_number, (col_left, row_top, col_right, row_bottom))
    return fields

def detect_box_fields(
    page,
    words: list[dict[str, object]],
    page_number: int,
) -> list[dict[str, object]]:
    fields: list[dict[str, object]] = []
    horizontals = horizontal_edges(page, 160.0)
    verticals = vertical_edges(page, 40.0)
    for idx, top_line in enumerate(horizontals):
        for bottom_line in horizontals[idx + 1:]:
            if abs(top_line[0] - bottom_line[0]) > 4 or abs(top_line[2] - bottom_line[2]) > 4:
                continue
            width = top_line[2] - top_line[0]
            height = bottom_line[1] - top_line[1]
            if width < 180 or height < 60 or height > page.height * 0.42:
                continue
            left = next((line for line in verticals if abs(line[0] - top_line[0]) < 3 and line[1] <= top_line[1] + 2 and line[2] >= bottom_line[1] - 2), None)
            right = next((line for line in verticals if abs(line[0] - top_line[2]) < 3 and line[1] <= top_line[1] + 2 and line[2] >= bottom_line[1] - 2), None)
            if not left or not right:
                continue
            append_blank_field(fields, words, page_number, (top_line[0], top_line[1], top_line[2], bottom_line[1]))
    return fields

def detect_ruled_line_fields(
    page,
    words: list[dict[str, object]],
    page_number: int,
) -> list[dict[str, object]]:
    fields: list[dict[str, object]] = []
    horizontals = horizontal_edges(page, 48.0)
    verticals = vertical_edges(page, 18.0)
    for x0, y, x1 in horizontals:
        width = x1 - x0
        if width < 110:
            continue
        left_support = any(abs(line[0] - x0) < 3 and line[1] <= y + 2 and line[2] >= y - 2 for line in verticals)
        right_support = any(abs(line[0] - x1) < 3 and line[1] <= y + 2 and line[2] >= y - 2 for line in verticals)
        if left_support or right_support:
            continue
        bbox = (x0, max(0.0, y - 16), x1, y + 8)
        append_blank_field(fields, words, page_number, bbox, kind='text', pad=0.6)
    return fields

def dedupe_detected_fields(fields: list[dict[str, object]]) -> list[dict[str, object]]:
    out: list[dict[str, object]] = []
    for field in fields:
        x0, top, x1, bottom = field['bbox']
        duplicate = False
        for existing in out:
            ex0, etop, ex1, ebottom = existing['bbox']
            overlap_x = max(0.0, min(x1, ex1) - max(x0, ex0))
            overlap_y = max(0.0, min(bottom, ebottom) - max(top, etop))
            overlap_area = overlap_x * overlap_y
            area = max((x1 - x0) * (bottom - top), 1.0)
            existing_area = max((ex1 - ex0) * (ebottom - etop), 1.0)
            overlap_ratio = overlap_area / min(area, existing_area)
            if overlap_ratio >= 0.82 or (abs(x0 - ex0) < 4 and abs(top - etop) < 4 and abs(x1 - ex1) < 4 and abs(bottom - ebottom) < 4):
                if existing.get('key') or field.get('key'):
                    existing.update({k: v for k, v in field.items() if v and k != 'bbox'})
                duplicate = True
                break
        if not duplicate:
            out.append(field)
    return out

def worksheet_page_data(pdf_doc, page_number: int, prefix: str) -> dict[str, object]:
    page = pdf_doc.pages[page_number - 1]
    words = page.extract_words(x_tolerance=2, y_tolerance=2)
    detected = dedupe_detected_fields(
        detect_table_fields(page, words, page_number)
        + detect_prompt_line_fields(page, words, page_number)
        + detect_open_table_fields(page, words, page_number)
        + detect_box_fields(page, words, page_number)
        + detect_ruled_line_fields(page, words, page_number)
    )
    width = float(page.width)
    height = float(page.height)
    fields = []
    for idx, field in enumerate(detected):
        x0, top, x1, bottom = field['bbox']
        fields.append({
            'id': f'p{page_number}-f{idx}',
            'kind': field['kind'],
            'label': str(field.get('label') or ''),
            'key': str(field.get('key') or ''),
            'x': round(x0 / width, 5),
            'y': round(top / height, 5),
            'w': round((x1 - x0) / width, 5),
            'h': round((bottom - top) / height, 5),
        })
    shared = []
    seen = set()
    for field in fields:
        if not field['key'] or field['key'] in seen:
            continue
        seen.add(field['key'])
        shared.append({'key': field['key'], 'label': field['label'], 'kind': 'text'})
    return {
        'pageNumber': page_number,
        'label': fmt_range(page_number, page_number),
        'src': f'{prefix}/pages/{page_name(page_number)}',
        'width': round(width, 3),
        'height': round(height, 3),
        'fields': fields,
        'sharedFields': shared,
    }

def worksheet_item_data(pdf_doc, title: str, start: int, end: int, prefix: str) -> dict[str, object] | None:
    pages = [worksheet_page_data(pdf_doc, page_number, prefix) for page_number in range(start, end + 1)]
    shared_fields: list[dict[str, object]] = []
    shared_seen = set()
    for page in pages:
        for field in page['sharedFields']:
            if field['key'] in shared_seen:
                continue
            shared_seen.add(field['key'])
            shared_fields.append(field)
    editable_pages = [page for page in pages if page['fields']]
    if not editable_pages:
        return None
    return {'title': title, 'sharedFields': shared_fields, 'pages': editable_pages}

def page_refs(prefix: str, title: str, start: int, end: int) -> list[dict[str, str]]:
    return [{'label':fmt_range(p,p),'src':f'{prefix}/pages/{page_name(p)}','title':f'{title} - PDF {p}'} for p in range(start,end+1)]

def section_data(spec: dict, sec: dict, texts: dict[int,str], prefix: str, lang: str, rgb: str, keyword_index: list[dict], worksheet_pdf=None) -> dict:
    items = []
    for title, start, end in sec['items']:
        manual = resolve_manual_entry(spec['key'], title)
        source_texts = [texts.get(p, '') for p in range(start, end + 1) if texts.get(p)]
        title_tags = curated_title_tags(title, spec['key'], lang)
        manual_tags = normalize_tag_specs(manual.get('tags', []), lang) if manual.get('tags') else []
        auto_tags = normalize_tag_specs([mtag(tag) for tag in extract_tags(title, source_texts, lang)], lang)
        tag_specs = normalize_tag_specs(manual_tags + title_tags + auto_tags, lang)
        if not tag_specs:
            tag_specs = normalize_tag_specs([mtag('핵심 개념')] if lang == 'ko' else [mtag('Core idea')], lang)
        tag_specs = tag_specs[:MAX_CARD_TAGS]
        tags = [tag['label'] for tag in tag_specs]
        lead = list(manual.get('summary', [])) if manual.get('summary') else []
        if manual.get('sparse'):
            if not lead:
                lead = [compose_summary(title, tags, lang)]
        else:
            auto_lead = preview(title, source_texts, lang, tags) or [UI[lang]['fallback']]
            lead = lead + [line for line in auto_lead if line not in lead]
        lead = lead[:1] if manual.get('sparse') else lead[:2]
        graph_seed = normalize_graph_spec(manual.get('graph') or graph_terms(title, tags, lang), title, tags, lang)
        tag_refs = []
        for idx, tag in enumerate(tag_specs):
            tag_id = f"{sec['id']}-{start}-{idx}"
            hits = keyword_hits(tag['queries'], texts, start, end, lang)
            page_numbers = sorted({hit['pageNumber'] for hit in hits}) or [start]
            keyword_index.append({
                'id': tag_id,
                'term': tag['label'],
                'description': lead[0],
                'excerpt': hits[0]['text'] if hits else lead[0],
                'pages': [{'label': fmt_range(page, page), 'src': f'{prefix}/pages/{page_name(page)}', 'title': f'{tag["label"]} - PDF {page}'} for page in page_numbers],
                'occurrences': [{'page': hit['page'], 'text': hit['text']} for hit in hits],
            })
            tag_refs.append({'id': tag_id, 'label': tag['label']})
        item = {
            'title': title,
            'range': fmt_range(start, end),
            'lead': lead,
            'facts': [
                {'label': UI[lang]['pagesFactLabel'], 'value': fmt_range(start, end)},
                {'label': UI[lang]['coverageFactLabel'], 'value': fmt_count(lang, start, end)},
            ],
            'tags': tag_refs,
            'pages': page_refs(prefix, title, start, end),
        }
        if worksheet_pdf is not None:
            worksheet = worksheet_item_data(worksheet_pdf, title, start, end, prefix)
            if worksheet:
                item['worksheet'] = worksheet
        items.append(item)
    starts = [i[1] for i in sec['items']]; ends = [i[2] for i in sec['items']]
    meta = [f"{len(sec['items'])}개 항목" if lang == 'ko' else f"{len(sec['items'])} items", fmt_range(min(starts), max(ends))]
    return {'id':sec['id'],'navLabel':sec['nav'],'title':sec['nav'],'description':'','rgb':rgb,'meta':meta,'items':items}

def report_switches(spec: dict, current_dir: Path | None = None) -> list[dict[str, object]]:
    lang = 'en' if spec['lang'] == 'en' else 'ko'; out = []
    current_dir = current_dir or spec['out']
    for group in ['main','secondary-main','secondary-workbook','elementary-main','elementary-workbook']:
        key = spec['main'] if group == 'main' else group
        out.append({'label':SWITCH[lang][group],'href':rel(current_dir, TARGETS[key]),'active':spec['group'] == group})
    return out

def lang_switches(spec: dict, current_dir: Path | None = None) -> list[dict[str, object]]:
    current_dir = current_dir or spec['out']
    if spec['lang_switch'] == 'ko-disabled':
        return [
            {'label':'ENG','href':'#','active':False,'disabled':True},
            {'label':'KOR','href':rel(current_dir, spec['out'] / 'index.html'),'active':True},
        ]
    if not spec['lang_switch']: return []
    return [{'label':'ENG','href':rel(current_dir, TARGETS['main-en']),'active':spec['lang_switch'] == 'en'},{'label':'KOR','href':rel(current_dir, TARGETS['main-ko']),'active':spec['lang_switch'] == 'ko'}]

def switch_markup(items: list[dict[str, object]]) -> str:
    out = []
    for item in items:
        classes = 'switch-chip' + (' active' if item.get('active') else '') + (' disabled' if item.get('disabled') else '')
        if item.get('disabled'):
            out.append(f'<span class="{classes}" aria-disabled="true">{item["label"]}</span>')
        else:
            out.append(f'<a href="{item["href"]}" class="{classes}">{item["label"]}</a>')
    return ''.join(out)

def html_shell(title: str, lang: str, out_dir: Path) -> str:
    css_href = rel(out_dir, SHARED_DIR / 'viewer.css')
    pdf_lib_href = rel(out_dir, SHARED_DIR / 'pdf-lib.min.js')
    viewer_href = rel(out_dir, SHARED_DIR / 'viewer.js')
    return f'''<!doctype html><html lang="{lang}"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>{title}</title><link rel="stylesheet" href="{css_href}" /></head><body><div id="app"></div><script src="{pdf_lib_href}"></script><script src="report.js"></script><script src="{viewer_href}"></script></body></html>'''

def info_html(spec: dict, count: int, info_dir: Path) -> str:
    info = INFO[spec['key']]
    css_href = rel(info_dir, SHARED_DIR / 'viewer.css')
    pdf_href = rel(info_dir, ASSETS_DIR / spec['asset'] / 'source.pdf')
    back_href = rel(info_dir, spec['out'] / 'index.html')
    switch_html = switch_markup(report_switches(spec, info_dir))
    lang_html = switch_markup(lang_switches(spec, info_dir))
    lang_switch_html = f'<div class="switch-row lang-switch-row">{lang_html}</div>' if lang_html else ''
    cover_src = rel(info_dir, ASSETS_DIR / spec['asset'] / 'pages' / page_name(1))
    groups = []
    for group in info['groups']:
        if group['kind'] == 'facts':
            cards = ''.join(f'<article class="info-card"><span>{label}</span><strong>{value}</strong></article>' for label, value in group['items'])
            groups.append(f'<section class="section-block"><div class="section-intro"><p class="kicker">{group["title"]}</p><h2>{group["title"]}</h2></div><div class="info-grid">{cards}</div></section>')
        else:
            cards = ''.join(f'<article class="credit-card"><strong>{person["name"]}</strong>{"<span>" + person["role"] + "</span>" if person.get("role") else ""}</article>' for person in group['items'])
            groups.append(f'<section class="section-block"><div class="section-intro"><p class="kicker">{group["title"]}</p><h2>{group["title"]}</h2></div><div class="credit-grid">{cards}</div></section>')
    groups_html = ''.join(groups)
    return f'''<!doctype html><html lang="{spec["html_lang"]}"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>{info["title"]}</title><link rel="stylesheet" href="{css_href}" /></head><body><div class="page-shell"><header class="site-header"><div class="header-top"><a class="brand" href="{back_href}"><div class="brand-mark">{spec["mark"]}</div><div class="brand-copy"><strong>{spec["brand"]}</strong><span>{spec["subbrand"]}</span></div></a><div class="header-tools"><div class="switch-row report-switch-row">{switch_html}</div>{lang_switch_html}<a class="pdf-button" href="{pdf_href}" target="_blank" rel="noreferrer">{spec["pdf_label"]}</a></div></div></header><main><section class="hero-grid"><div class="hero-panel"><div class="eyebrow">{info["title"]}</div><h1 class="hero-title">{spec["brand"]}<span>{spec["subbrand"]}</span></h1><p class="hero-subtitle">{spec["strap"]}</p><p class="hero-description">{info.get("desc", "")}</p><div class="hero-actions"><a class="primary" href="{back_href}">{info["back"]}</a></div></div><aside class="cover-panel"><div class="cover-top"><span>{spec["pdf_label"]}</span><span>{fmt_count(spec["lang"], 1, count)}</span></div><a class="cover-button" href="{pdf_href}" target="_blank" rel="noreferrer"><img src="{cover_src}" alt="{spec["brand"]}" /></a></aside></section>{groups_html}</main></div></body></html>'''

def build(spec: dict) -> None:
    out_dir = spec['out']; out_dir.mkdir(parents=True, exist_ok=True)
    asset_dir = ASSETS_DIR / spec['asset']; pages_dir = asset_dir / 'pages'; pages_dir.mkdir(parents=True, exist_ok=True)
    count = len(PdfReader(str(spec['pdf'])).pages); print(f"[build] {spec['key']} -> {count} pages")
    render_pages(spec['pdf'], pages_dir, count); shutil.copy2(spec['pdf'], asset_dir / 'source.pdf')
    texts = load_texts(spec['pdf'], set(range(1, count + 1)), spec['lang']); prefix = rel(out_dir, asset_dir)
    sections, idx, keyword_index = [], 0, []
    worksheet_pdf = pdfplumber.open(spec['pdf']) if spec['group'] in WORKBOOK_GROUPS else None
    try:
        for sec in spec['sections']:
            rgb = PALETTE[idx % len(PALETTE)]; idx += 1
            if sec.get('kind') == 'credits':
                sections.append({'id':sec['id'],'navLabel':sec['nav'],'title':sec['nav'],'description':'','rgb':rgb,'kind':'credits','people':sec['people']})
            else:
                sections.append(section_data(spec, sec, texts, prefix, spec['lang'], rgb, keyword_index, worksheet_pdf))
    finally:
        if worksheet_pdf is not None:
            worksheet_pdf.close()
    hero_keywords = []
    for kid, term, desc, pages in spec['keys']:
        hits = keyword_hits(term, texts, min(pages), max(pages), spec['lang'], 3)
        fallback = preview(term, [texts.get(p,'') for p in pages], spec['lang'], [term], 1) or [UI[spec['lang']]['fallback']]
        detail = {'id':kid,'term':term,'description':desc,'excerpt':hits[0]['text'] if hits else fallback[0],'pages':[{'label':fmt_range(p,p),'src':f'{prefix}/pages/{page_name(p)}','title':f'{term} - PDF {p}'} for p in pages],'occurrences':[{'page':hit['page'],'text':hit['text']} for hit in hits]}
        hero_keywords.append({'id':kid,'term':term})
        keyword_index.append(detail)
    data = {'themeRgb':PALETTE[0],'brand':{'mark':spec['mark'],'title':spec['brand'],'subtitle':spec['subbrand']},'ui':UI[spec['lang']],'reportSwitches':report_switches(spec),'languageSwitches':lang_switches(spec),'sourcePdf':{'href':f'{prefix}/source.pdf','label':spec['pdf_label']},'infoLink':{'href':'info/index.html','label':UI[spec['lang']]['infoLabel']},'nav':[{'label':s['navLabel'],'target':s['id']} for s in sections],'hero':{'eyebrow':spec['eyebrow'],'title':spec['title'],'subtitle':spec['subtitle'],'strapline':spec['strap'],'description':spec['desc'],'stats':[],'actions':[{'href':f"#{sections[0]['id']}",'label':UI[spec['lang']]['browseLabel']},{'href':f"#{sections[1]['id']}" if len(sections) > 1 else f"#{sections[0]['id']}",'label':UI[spec['lang']]['jumpLabel']}],'coverLabel':'Cover' if spec['lang'] == 'en' else '표지','coverPageLabel':fmt_range(1,1),'cover':{'src':f'{prefix}/pages/{page_name(1)}','title':f"{spec['brand']} - PDF 1"}},'sections':sections,'keywords':hero_keywords,'keywordIndex':keyword_index,'footer':spec.get('footer', '')}
    (out_dir / 'index.html').write_text(html_shell(spec['brand'], spec['html_lang'], out_dir), encoding='utf-8')
    (out_dir / 'report.js').write_text('window.REPORT_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    info_dir = out_dir / 'info'; info_dir.mkdir(parents=True, exist_ok=True)
    (info_dir / 'index.html').write_text(info_html(spec, count, info_dir), encoding='utf-8')

def main() -> None:
    for p in [MAIN_KO_PDF, MAIN_EN_PDF, SECONDARY_MAIN_PDF, SECONDARY_WORKBOOK_PDF, ELEMENTARY_MAIN_PDF, ELEMENTARY_WORKBOOK_PDF]:
        if not p.exists(): raise FileNotFoundError(p)
    archive_legacy()
    for path in [SITE_DIR / 'index.html', SITE_DIR / 'report.js', KO_DIR, REPORTS_DIR, ASSETS_DIR]: clean(path)
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    for spec in REPORTS: build(spec)
    print('[done] site rebuilt')

if __name__ == '__main__': main()



