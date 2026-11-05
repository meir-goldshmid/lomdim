// Built-in English content. q = English, a = Hebrew, e = emoji picture (optional)
const w = s => s.trim().split('\n').map(l => { const [q, a, e] = l.split('|').map(x => x.trim()); return { q, a, e }; });

export const ABC = 'A|apple|🍎,B|ball|⚽,C|cat|🐱,D|dog|🐶,E|egg|🥚,F|fish|🐟,G|goat|🐐,H|hat|🎩,I|ice cream|🍦,J|juice|🧃,K|kite|🪁,L|lion|🦁,M|moon|🌙,N|nose|👃,O|orange|🍊,P|pig|🐷,Q|queen|👸,R|rabbit|🐰,S|sun|☀️,T|tree|🌳,U|umbrella|☂️,V|van|🚐,W|watch|⌚,X|fox|🦊,Y|yo-yo|🪀,Z|zebra|🦓'
  .split(',').map(s => { const [L, word, e] = s.split('|'); return { q: L, a: L.toLowerCase(), word, e }; });

export const PACKS = [
  { id: 'abc', name: 'אותיות וצלילים', em: '🔤', type: 'abc', items: ABC },
  { id: 'phonics', name: 'קוראים מילים (צלילים)', em: '📖', type: 'phonics', items: w(`
cat|חתול|🐱
dog|כלב|🐶
sun|שמש|☀️
hat|כובע|🎩
pig|חזיר|🐷
bed|מיטה|🛏️
bus|אוטובוס|🚌
cup|כוס|🥤
fox|שועל|🦊
box|קופסה|📦
map|מפה|🗺️
net|רשת|🥅
hen|תרנגולת|🐔
bug|חרק|🐛
pen|עט|🖊️
six|שש|6️⃣
ten|עשר|🔟
web|קורי עכביש|🕸️
bat|עטלף|🦇
rat|עכברוש|🐀
mug|ספל|☕
van|טנדר|🚐
jam|ריבה|🍓
log|בול עץ|🪵
`) },
  { id: 'words1', name: 'מילים ראשונות', em: '🐶', items: w(`
cat|חתול|🐱
dog|כלב|🐶
cow|פרה|🐮
horse|סוס|🐴
bird|ציפור|🐦
fish|דג|🐟
lion|אריה|🦁
monkey|קוף|🐒
elephant|פיל|🐘
duck|ברווז|🦆
red|אדום|🟥
blue|כחול|🟦
green|ירוק|🟩
yellow|צהוב|🟨
black|שחור|⬛
white|לבן|⬜
one|אחת|1️⃣
two|שתיים|2️⃣
three|שלוש|3️⃣
four|ארבע|4️⃣
five|חמש|5️⃣
ten|עשר|🔟
apple|תפוח|🍎
banana|בננה|🍌
bread|לחם|🍞
milk|חלב|🥛
water|מים|💧
cake|עוגה|🎂
egg|ביצה|🥚
cheese|גבינה|🧀
house|בית|🏠
door|דלת|🚪
bed|מיטה|🛏️
chair|כיסא|🪑
table|שולחן|🍽️
book|ספר|📕
pencil|עיפרון|✏️
bag|תיק|🎒
car|מכונית|🚗
bus|אוטובוס|🚌
ball|כדור|⚽
sun|שמש|☀️
moon|ירח|🌙
star|כוכב|⭐
tree|עץ|🌳
flower|פרח|🌸
rain|גשם|🌧️
hand|יד|✋
eye|עין|👁️
ear|אוזן|👂
nose|אף|👃
mouth|פה|👄
foot|כף רגל|🦶
head|ראש|🙂
mother|אמא|👩
father|אבא|👨
baby|תינוק|👶
boy|ילד|👦
girl|ילדה|👧
happy|שמח|😀
sad|עצוב|😢
big|גדול|🐘
small|קטן|🐭
hot|חם|🔥
cold|קר|🥶
run|לרוץ|🏃
eat|לאכול|🍽️
sleep|לישון|😴
jump|לקפוץ|🦘
swim|לשחות|🏊
read|לקרוא|📖
write|לכתוב|✍️
shoe|נעל|👟
shirt|חולצה|👕
hat|כובע|🎩
clock|שעון|🕐
phone|טלפון|📱
key|מפתח|🔑
box|קופסה|📦
`) },
  { id: 'words2', name: 'אוצר מילים – חטיבה', em: '📚', items: w(`
always|תמיד
never|אף פעם
sometimes|לפעמים
usually|בדרך כלל
because|כי, מפני ש
although|למרות ש
however|אולם
between|בין
during|במשך
without|בלי
already|כבר
enough|מספיק
borrow|לשאול (חפץ)
lend|להשאיל
choose|לבחור
decide|להחליט
explain|להסביר
believe|להאמין
forget|לשכוח
remember|לזכור
understand|להבין
improve|לשפר
arrive|להגיע
leave|לעזוב
build|לבנות
break|לשבור
carry|לסחוב
catch|לתפוס
change|לשנות
collect|לאסוף
describe|לתאר
discover|לגלות
hope|לקוות
invite|להזמין
win|לנצח
lose|להפסיד
answer|תשובה, לענות
question|שאלה
language|שפה
country|מדינה
city|עיר
village|כפר
world|עולם
history|היסטוריה
science|מדע
library|ספרייה
neighbor|שכן
holiday|חג
vacation|חופשה
weather|מזג אוויר
health|בריאות
danger|סכנה
dangerous|מסוכן
famous|מפורסם
strange|מוזר
special|מיוחד
important|חשוב
different|שונה
difficult|קשה
easy|קל
expensive|יקר
cheap|זול
empty|ריק
full|מלא
quiet|שקט
loud|רועש
brave|אמיץ
proud|גאה
tired|עייף
angry|כועס
afraid|מפחד
surprised|מופתע
excited|נרגש
honest|כן, ישר
polite|מנומס
lazy|עצלן
clever|חכם
healthy|בריא
early|מוקדם
late|מאוחר
quickly|מהר
slowly|לאט
together|ביחד
alone|לבד
`) },
  { id: 'grammar', name: 'דקדוק – השלמת משפטים', em: '✍️', type: 'grammar', items: [
    ['I ___ a student.', 'am', 'is,are,be', 'אני תלמיד/ה'],
    ['She ___ my sister.', 'is', 'am,are,be', 'היא אחותי'],
    ['They ___ at school.', 'are', 'is,am,be', 'הם בבית הספר'],
    ['We ___ happy today.', 'are', 'is,am,was', 'אנחנו שמחים היום'],
    ['He ___ football every day.', 'plays', 'play,playing,played', 'הוא משחק כדורגל כל יום (Present Simple → s בגוף שלישי)'],
    ['I ___ like fish.', "don't", "doesn't,isn't,not", 'אני לא אוהב דגים'],
    ['She ___ like pizza.', "doesn't", "don't,isn't,not", 'היא לא אוהבת פיצה'],
    ['___ you speak English?', 'Do', 'Does,Are,Is', 'האם אתה מדבר אנגלית?'],
    ['___ he live in Jerusalem?', 'Does', 'Do,Is,Are', 'האם הוא גר בירושלים?'],
    ['Yesterday I ___ to the park.', 'went', 'go,goes,going', 'אתמול הלכתי לפארק (Past Simple של go)'],
    ['Last week we ___ a movie.', 'watched', 'watch,watches,watching', 'בשבוע שעבר צפינו בסרט'],
    ['She ___ a letter yesterday.', 'wrote', 'write,writes,written', 'היא כתבה מכתב אתמול'],
    ['Look! The baby ___.', 'is sleeping', 'sleeps,sleep,slept', 'תראה! התינוק ישן עכשיו (Present Progressive)'],
    ['I am ___ a book now.', 'reading', 'read,reads,readed', 'אני קורא ספר עכשיו'],
    ['I have ___ apple.', 'an', 'a,the,some', 'an לפני תנועה (a,e,i,o,u)'],
    ['She has ___ dog.', 'a', 'an,two,some', 'a לפני עיצור'],
    ['The book is ___ the table.', 'on', 'in,at,under', 'הספר על השולחן'],
    ['The cat is ___ the box.', 'in', 'on,at,of', 'החתול בתוך הקופסה'],
    ['School starts ___ 8 o\'clock.', 'at', 'in,on,to', 'at לפני שעה'],
    ['My birthday is ___ May.', 'in', 'at,on,to', 'in לפני חודש'],
    ['We have a test ___ Monday.', 'on', 'in,at,to', 'on לפני יום'],
    ['This is ___ book. (of me)', 'my', 'me,I,mine', 'הספר שלי'],
    ['Give the ball to ___. (him)', 'him', 'he,his,he\'s', 'תן את הכדור לו'],
    ['There ___ three cats in the garden.', 'are', 'is,am,be', 'יש שלושה חתולים (רבים → are)'],
    ['There ___ a bird on the tree.', 'is', 'are,am,be', 'יש ציפור על העץ'],
    ['An elephant is ___ than a mouse.', 'bigger', 'big,biggest,more big', 'דרגת השוואה: big → bigger'],
    ['This is the ___ day of the year.', 'happiest', 'happy,happier,most happy', 'דרגה עליונה: happy → happiest'],
    ['She can ___ very fast.', 'run', 'runs,running,ran', 'אחרי can → פועל בסיסי'],
    ['Tomorrow I ___ visit my grandma.', 'will', 'am,did,was', 'עתיד: will + פועל'],
    ['I have ___ finished my homework.', 'already', 'yet,ever,since', 'Present Perfect: already = כבר'],
    ['How ___ apples do you have?', 'many', 'much,more,lot', 'many לדברים שסופרים'],
    ['How ___ water is there?', 'much', 'many,more,lot', 'much לדברים שלא סופרים'],
    ['If it rains, we ___ stay home.', 'will', 'would,are,did', 'תנאי ראשון: If + הווה, will'],
    ['The children ___ playing outside now.', 'are', 'is,was,be', 'children = רבים'],
    ['He ___ TV when I called.', 'was watching', 'watched,watches,is watching', 'Past Progressive'],
  ].map(([s, a, wr, he]) => ({ q: s, a, wrong: wr.split(','), he })) },
];
