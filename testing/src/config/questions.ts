export const WHATSAPP_NUMBER = '919972934937';

export interface Role {
  id: string;
  label: string;
  labelEn: string;
}

export interface Question {
  id: string;
  q: string;
  options: string[];
}

export const roles: Role[] = [
  { id: 'customer', label: '\u0917\u094d\u0930\u093e\u0939\u0915', labelEn: 'Customer' },
  { id: 'shopkeeper', label: '\u0926\u0941\u0915\u093e\u0928\u0926\u093e\u0930', labelEn: 'Shopkeeper' },
  { id: 'expert', label: '\u090f\u0915\u094d\u0938\u092a\u0930\u094d\u091f', labelEn: 'Expert' },
];

const recommendQuestion: Question = {
  id: 'recommend',
  q: 'Kya aap BazaarSetu ko apne dost ya parivaar ko recommend karenge? / Would you recommend BazaarSetu to your friends or family?',
  options: ['Haan - Yes', 'Nahi - No', 'Shayad - Maybe'],
};

export const questions: Record<string, Question[]> = {
  customer: [
    {
      id: 'intent',
      q: 'Kya aap apni nearby local dukaan se online order karna pasand karenge? / Would you like to place orders online from your nearby local shops?',
      options: ['Haan - Yes', 'Nahi - No'],
    },
    {
      id: 'mode',
      q: 'Aap order dene ke liye kya tarika pasand karenge \u2014 WhatsApp jaisa chat ya product catalog se select karna? / How would you prefer to order \u2014 through chat like WhatsApp or by browsing a product catalog?',
      options: ['Chat', 'Catalog', 'Dono - Both'],
    },
    {
      id: 'udhaar',
      q: 'Kya aap udhaar (credit) ki suvidha ka istemal karenge agar dukaan wale dein? / Would you use a credit/udhaar facility if your shopkeeper offered it?',
      options: ['Haan - Yes', 'Nahi - No', 'Shayad - Maybe'],
    },
    {
      id: 'usage',
      q: 'Agar yeh service available ho toh aap kitni baar use karenge? / How often would you use this service if available?',
      options: ['Roz - Daily', 'Hafte mein - Weekly', 'Kabhi kabhi - Rarely'],
    },
    {
      id: 'pay',
      q: 'Kya aap is suvidha ke liye \u20b910 se \u20b930 tak extra dene ko tayyar hain? / Are you willing to pay \u20b910 to \u20b930 extra for this convenience?',
      options: ['Haan - Yes', 'Nahi - No'],
    },
    recommendQuestion,
  ],
  shopkeeper: [
    {
      id: 'online',
      q: 'Kya aap apne graahakon se online orders lena chahenge? / Would you like to accept orders from your customers online?',
      options: ['Haan - Yes', 'Nahi - No'],
    },
    {
      id: 'chat',
      q: 'Kya aapko lagta hai ki chat ke zariye order lena aapke business ke liye faydemand hoga? / Do you think accepting orders via chat would be beneficial for your business?',
      options: ['Haan - Yes', 'Nahi - No'],
    },
    {
      id: 'udhaar',
      q: 'Kya aap abhi apne graahakon ko udhaar (credit) dete hain? / Do you currently offer credit/udhaar to your customers?',
      options: ['Haan - Yes', 'Nahi - No'],
    },
    {
      id: 'digital_udhaar',
      q: 'Kya aap udhaar ka digital record rakhna chahenge taaki hisaab saaf rahe? / Would you like to maintain digital records of udhaar for clear accounting?',
      options: ['Haan - Yes', 'Nahi - No'],
    },
    {
      id: 'pay',
      q: 'Kya aap is digital platform ke liye \u20b999 se \u20b9299 per month dene ko tayyar hain? / Are you willing to pay \u20b999 to \u20b9299 per month for this digital platform?',
      options: ['Haan - Yes', 'Nahi - No'],
    },
    recommendQuestion,
  ],
  expert: [
    {
      id: 'market',
      q: 'Kya aapko lagta hai ki hyperlocal commerce Tier-2 aur Tier-3 shehron mein chalega? / Do you think hyperlocal commerce will work in Tier-2 and Tier-3 cities?',
      options: ['Haan - Yes', 'Nahi - No'],
    },
    {
      id: 'udhaar_scale',
      q: 'Kya udhaar (credit) ka digitalization bade scale par ho sakta hai ya risky hai? / Is digitalization of udhaar scalable at a large scale or is it risky?',
      options: ['Haan - Yes', 'Nahi - No', 'Risk hai - Risky'],
    },
    {
      id: 'risk',
      q: 'Is business model ka sabse bada risk kya ho sakta hai? / What is the biggest risk for this business model?',
      options: ['Bharosa - Trust', 'Pratiyogita - Competition', 'Sanchalan - Operations'],
    },
    recommendQuestion,
  ],
};

export const questionLabels: Record<string, string> = {
  intent: 'Nearby dukaan se online order / Order from nearby shop online',
  mode: 'Order ka tarika / Order preference',
  udhaar: 'Udhaar use karenge / Credit usage',
  usage: 'Kitni baar use karenge / Usage frequency',
  pay: '\u20b910\u2013\u20b930 extra dene ko tayyar / Willing to pay \u20b910\u2013\u20b930',
  online: 'Online orders lenge / Accept online orders',
  chat: 'Chat se order lena useful / Chat ordering useful',
  digital_udhaar: 'Digital udhaar record / Digital credit record',
  market: 'Tier-2 mein chalega / Works in Tier-2',
  udhaar_scale: 'Udhaar scalable hai / Credit is scalable',
  risk: 'Sabse bada risk / Biggest risk',
  recommend: 'Recommend karenge / Will recommend',
};
