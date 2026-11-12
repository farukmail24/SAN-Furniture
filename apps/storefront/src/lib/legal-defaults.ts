/**
 * Default CMS content for SAN Furniture Limited legal pages (/terms and /privacy).
 * Structured for comfortable editing in Admin -> Page Content (CMS) while preserving
 * exact statutory clause numbering, definitions tables, and cookie schedules.
 */

export interface LegalSectionItem {
  id: string;
  title: string;
  body: string;
}

export interface LegalPageCmsContent {
  page_badge: string;
  page_title: string;
  page_subtitle: string;
  notice_title: string;
  notice_body: string;
  sections: LegalSectionItem[];
}

export const LEGAL_TERMS_DEFAULT_CONTENT: LegalPageCmsContent = {
  page_badge: "SAN Furniture Limited • Company No. 11733475",
  page_title: "SAN Furniture Limited — Terms and Conditions",
  page_subtitle:
    "Registered office: 112 Coventry Road, Exhall, West Midlands, CV7 9EU • Registered in England and Wales.",
  notice_title: "Important Notice",
  notice_body:
    "Please read all these Terms and Conditions. As we can accept your order and make a legally enforceable agreement without further reference to you, you must read these Terms and Conditions to make sure that they contain all that you want and nothing that you are not happy with. If you are not sure about anything, just phone us on +4420 3150 3472.",
  sections: [
    {
      id: "application",
      title: "Application",
      body: [
        "1. These Terms and Conditions will apply to the purchase of the goods by you (the Customer or you). We are SAN Furniture Limited a company registered in England and Wales under number 11733475 whose registered office is at 112 Coventry Road, Exhall, West Midlands, CV7 9EU with email address privacy@sanfurniture.com; telephone number +4420 3150 3472; (the Supplier or us or we).",
        "2. These are the terms on which we sell all Goods to you. By ordering any of the Goods, you agree to be bound by these Terms and Conditions. Before placing an order on the Website, you will be asked to agree to these Terms and Conditions by clicking on the button marked 'I Accept'. If you do not click on the button, you will not be able to complete your Order. You can only purchase the Goods from the Website if you are eligible to enter into a contract and are at least 18 years old.",
      ].join("\n\n"),
    },
    {
      id: "interpretation",
      title: "Interpretation",
      body: [
        "1. **Consumer** means an individual acting for purposes which are wholly or mainly outside their trade, business, craft or profession;",
        "2. **Contract** means the legally-binding agreement between you and us for the supply of the Goods;",
        "3. **Delivery Location** means the Supplier's premises or other location where the Goods are to be supplied, as set out in the Order;",
        "4. **Durable Medium** means paper or email, or any other medium that allows information to be addressed personally to the recipient, enables the recipient to store the information in a way accessible for future reference for a period that is long enough for the purposes of the information, and allows the unchanged reproduction of the information stored;",
        "5. **Goods** means the goods advertised on the Website that we supply to you of the number and description as set out in the Order;",
        "6. **Order** means the Customer's order for the Goods from the Supplier as submitted following the step by step process set out on the Website;",
        "7. **Privacy Policy** means the terms which set out how we will deal with confidential and personal information received from you via the Website;",
        "8. **Website** means our website www.sanfurniture.com on which the Goods are advertised.",
      ].join("\n\n"),
    },
    {
      id: "goods",
      title: "Goods",
      body: [
        "1. The description of the Goods is as set out in the Website, catalogues, brochures or other form of advertisement. Any description is for illustrative purposes only and there may be small discrepancies in the size and colour of the Goods supplied.",
        "2. In the case of any Goods made to your special requirements, it is your responsibility to ensure that any information or specification you provide is accurate.",
        "3. All Goods which appear on the Website are subject to availability.",
        "4. We can make changes to the Goods which are necessary to comply with any applicable law or safety requirement. We will notify you of these changes.",
      ].join("\n\n"),
    },
    {
      id: "personal-information",
      title: "Personal Information and Registration",
      body: [
        "1. When registering to use the Website you must set up a username and password. You remain responsible for all actions taken under the chosen username and password and undertake not to disclose your username and password to anyone else and keep them secret.",
        "2. We retain and use all information strictly under the Privacy Policy.",
        "3. We may contact you by using e-mail or other electronic communication methods and by pre-paid post and you expressly agree to this.",
      ].join("\n\n"),
    },
    {
      id: "basis-of-sale",
      title: "Basis of Sale",
      body: [
        "1. The description of the Goods in our website does not constitute a contractual offer to sell the Goods. When an Order has been submitted on the Website, we can reject it for any reason, although we will try to tell you the reason without delay.",
        "2. The Order process is set out on the Website. Each step allows you to check and amend any errors before submitting the Order. It is your responsibility to check that you have used the ordering process correctly.",
        "3. A Contract will be formed for the sale of Goods ordered only when you receive an email from us confirming the Order (Order Confirmation). You must ensure that the Order Confirmation is complete and accurate and inform us immediately of any errors. We are not responsible for any inaccuracies in the Order placed by you. By placing an Order you agree to us giving you confirmation of the Contract by means of an email with all information in it (ie the Order Confirmation). You will receive the Order Confirmation within a reasonable time after making the Contract, but in any event not later than the delivery of any Goods supplied under the Contract.",
        "4. Any quotation is valid for a maximum period of 7 days from its date, unless we expressly withdraw it at an earlier time.",
        "5. No variation of the Contract, whether about description of the Goods, Fees or otherwise, can be made after it has been entered into unless the variation is agreed by the Customer and the Supplier in writing.",
        "6. We intend that these Terms and Conditions apply only to a Contract entered into by you as a Consumer. If this is not the case, you must tell us, so that we can provide you with a different contract with terms which are more appropriate for you and which might, in some respects, be better for you, eg by giving you rights as a business.",
      ].join("\n\n"),
    },
    {
      id: "price-and-payment",
      title: "Price and Payment",
      body: [
        "1. The price of the Goods and any additional delivery or other charges is that set out on the Website at the date of the Order or such other price as we may agree in writing.",
        "2. Prices and charges include VAT at the rate applicable at the time of the Order.",
        "3. You must pay by submitting your credit or debit card details with your Order and we can take payment immediately or otherwise before delivery of the Goods.",
      ].join("\n\n"),
    },
    {
      id: "delivery",
      title: "Delivery",
      body: [
        "1. We will deliver the Goods, to the Delivery Location by the time or within the agreed period or, failing any agreement, without undue delay and, in any event, not more than 30 days after the day on which the Contract is entered into.",
        "2. In any case, regardless of events beyond our control, if we do not deliver the Goods on time, you can (in addition to any other remedies) treat the Contract at an end if:",
        "2.1 we have refused to deliver the Goods, or if delivery on time is essential taking into account all the relevant circumstances at the time the Contract was made, or you said to us before the Contract was made that delivery on time was essential; or",
        "2.2 after we have failed to deliver on time, you have specified a later period which is appropriate to the circumstances and we have not delivered within that period.",
        "3. If you treat the Contract at an end, we will (in addition to other remedies) promptly return all payments made under the Contract.",
        "4. If you were entitled to treat the Contract at an end, but do not do so, you are not prevented from cancelling the Order for any Goods or rejecting Goods that have been delivered and, if you do this, we will (in addition to other remedies) without delay return all payments made under the Contract for any such cancelled or rejected Goods. If the Goods have been delivered, you must return them to us or allow us to collect them from you and we will pay the costs of this.",
        "5. If any Goods form a commercial unit (a unit is a commercial unit if division of the unit would materially impair the value of the goods or the character of the unit) you cannot cancel or reject the Order for some of those Goods without also cancelling or rejecting the Order for the rest of them.",
        "6. We do not generally deliver to addresses outside England and Wales, Scotland, Northern Ireland, the Isle of Man and the Channels Islands. If, however, we accept an Order for delivery outside that area, you may need to pay import duties or other taxes, as we will not pay them.",
        "7. You agree we may deliver the Goods in instalments if we suffer a shortage of stock or other genuine and fair reason, subject to the above provisions and provided you are not liable for extra charges.",
        "8. If you or your nominee fail, through no fault of ours, to take delivery of the Goods at the Delivery Location, we may charge the reasonable costs of storing and redelivering them.",
        "9. The Goods will become your responsibility from the completion of delivery or Customer collection. You must, if reasonably practicable, examine the Goods before accepting them.",
      ].join("\n\n"),
    },
    {
      id: "risk-and-title",
      title: "Risk and Title",
      body: [
        "1. Risk of damage to, or loss of, any Goods will pass to you when the Goods are delivered to you.",
        "2. You do not own the Goods until we have received payment in full. If full payment is overdue or a step occurs towards your bankruptcy, we can choose, by notice to cancel any delivery and end any right to use the Goods still owned by you, in which case you must return them or allow us to collect them.",
      ].join("\n\n"),
    },
    {
      id: "withdrawal-returns",
      title: "Withdrawal, Returns and Cancellation",
      body: [
        "1. You can withdraw the Order by telling us before the Contract is made, if you simply wish to change your mind and without giving us a reason, and without incurring any liability.",
        "2. This is a distance contract (as defined below) which has the cancellation rights (Cancellation Rights) set out below. These Cancellation Rights, however, do not apply, to a contract for the following goods (with no others) in the following circumstances:",
        "2.1 foodstuffs, beverages or other goods intended for current consumption in the household and which are supplied on frequent and regular rounds to your residence or workplace;",
        "2.2 goods that are made to your specifications or are clearly personalised;",
        "2.3 goods which are liable to deteriorate or expire rapidly.",
        "3. Also, the Cancellation Rights for a Contract cease to be available in the following circumstances:",
        "3.1 in the case of any sales contract, if the goods become mixed inseparably (according to their nature) with other items after delivery.",
      ].join("\n\n"),
    },
    {
      id: "right-to-cancel",
      title: "Right to Cancel",
      body: [
        "1. Subject as stated in these Terms and Conditions, you can cancel this contract within 14 days without giving any reason.",
        "2. The cancellation period will expire after 14 days from the day on which you acquire, or a third party, other than the carrier indicated by you, acquires physical possession of the last of the Goods. In a contract for the supply of goods over time (ie subscriptions), the right to cancel will be 14 days after the first delivery.",
        "3. To exercise the right to cancel, you must inform us of your decision to cancel this Contract by a clear statement setting out your decision (eg a letter sent by post or email). You can use the attached model cancellation form, but it is not obligatory. In any event, you must be able to show clear evidence of when the cancellation was made, so you may decide to use the model cancellation form.",
        "4. You can also electronically fill in and submit the model cancellation form or any other clear statement of the Customer's decision to cancel the Contract on our website www.sanfurniture.com. If you use this option, we will communicate to you an acknowledgement of receipt of such a cancellation in a Durable Medium (eg by email) without delay.",
        "5. To meet the cancellation deadline, it is sufficient for you to send your communication concerning your exercise of the right to cancel before the cancellation period has expired.",
      ].join("\n\n"),
    },
    {
      id: "effects-of-cancellation",
      title: "Effects of Cancellation in the Cancellation Period",
      body: "1. Except as set out below, if you cancel this Contract, we will reimburse to you all payments received from you, including the costs of delivery (except for the supplementary costs arising if you chose a type of delivery other than the least expensive type of standard delivery offered by us).",
    },
    {
      id: "deduction-for-goods",
      title: "Deduction for Goods Supplied",
      body: "1. We may make a deduction from the reimbursement for loss in value of any Goods supplied, if the loss is the result of unnecessary handling by you (ie handling the Goods beyond what is necessary to establish the nature, characteristics and functioning of the Goods: eg it goes beyond the sort of handling that might be reasonably allowed in a shop). This is because you are liable for that loss and, if that deduction is not made, you must pay us the amount of that loss.",
    },
    {
      id: "timing-of-reimbursement",
      title: "Timing of Reimbursement",
      body: [
        "1. If we have not offered to collect the Goods, we will make the reimbursement without undue delay, and not later than:",
        "1.1 14 days after the day we receive back from you any Goods supplied, or",
        "1.2 (if earlier) 14 days after the day you provide evidence that you have sent back the Goods.",
        "2. If we have offered to collect the Goods or if no Goods were supplied, we will make the reimbursement without undue delay, and not later than 14 days after the day on which we are informed about your decision to cancel this Contract.",
        "3. We will make the reimbursement using the same means of payment as you used for the initial transaction, unless you have expressly agreed otherwise; in any event, you will not incur any fees as a result of the reimbursement.",
      ].join("\n\n"),
    },
    {
      id: "returning-goods",
      title: "Returning Goods",
      body: [
        "1. If you have received Goods in connection with the Contract which you have cancelled, you must send back the Goods or hand them over to us at the address provided by email (warehouse return address will be confirmed by email), without delay and in any event not later than 14 days from the day on which you communicate to us your cancellation of this Contract. The deadline is met if you send back the Goods before the period of 14 days has expired. You agree that you will have to bear the cost of returning the Goods.",
        "2. For the purposes of these Cancellation Rights, these words have the following meanings:",
        "2.1 **distance contract** means a contract concluded between a trader and a consumer under an organised distance sales or service-provision scheme without the simultaneous physical presence of the trader and the consumer, with the exclusive use of one or more means of distance communication up to and including the time at which the contract is concluded;",
        "2.2 **sales contract** means a contract under which a trader transfers or agrees to transfer the ownership of goods to a consumer and the consumer pays or agrees to pay the price, including any contract that has both goods and services as its object.",
      ].join("\n\n"),
    },
    {
      id: "conformity",
      title: "Conformity",
      body: [
        "1. We have a legal duty to supply the Goods in conformity with the Contract, and will not have conformed if it does not meet the following obligation.",
        "2. Upon delivery, the Goods will:",
        "2.1 be of satisfactory quality;",
        "2.2 be reasonably fit for any particular purpose for which you buy the Goods which, before the Contract is made, you made known to us (unless you do not actually rely, or it is unreasonable for you to rely, on our skill and judgment) and be fit for any purpose held out by us or set out in the Contract; and",
        "2.3 conform to their description.",
        "3. It is not a failure to conform if the failure has its origin in your materials.",
      ].join("\n\n"),
    },
    {
      id: "successors-subcontractors",
      title: "Successors and Our Sub-Contractors",
      body: "1. Either party can transfer the benefit of this Contract to someone else, and will remain liable to the other for its obligations under the Contract. The Supplier will be liable for the acts of any sub-contractors who it chooses to help perform its duties.",
    },
    {
      id: "circumstances-beyond-control",
      title: "Circumstances Beyond the Control of Either Party",
      body: [
        "1. In the event of any failure by a party because of something beyond its reasonable control:",
        "1.1 the party will advise the other party as soon as reasonably practicable; and",
        "1.2 the party's obligations will be suspended so far as is reasonable, provided that that party will act reasonably, and the party will not be liable for any failure which it could not reasonably avoid, but this will not affect the Customer's above rights relating to delivery and any right to cancel, below.",
      ].join("\n\n"),
    },
    {
      id: "privacy",
      title: "Privacy",
      body: [
        "1. Your privacy is critical to us. We respect your privacy and comply with the General Data Protection Regulation with regard to your personal information.",
        "2. These Terms and Conditions should be read alongside, and are in addition to our policies, including our Privacy Policy (https://www.sanfurniture.com/privacy) and Cookies Policy (https://www.sanfurniture.com/privacy).",
        "3. For the purposes of these Terms and Conditions:",
        "3.1 'Data Protection Laws' means any applicable law relating to the processing of Personal Data, including, but not limited to the GDPR.",
        "3.2 'GDPR' means the UK General Data Protection Regulation.",
        "3.3 'Data Controller', 'Personal Data' and 'Processing' shall have the same meaning as in the GDPR.",
        "4. We are a Data Controller of the Personal Data we Process in providing Goods to you.",
        "5. Where you supply Personal Data to us so we can provide Goods to you, and we Process that Personal Data in the course of providing the Goods to you, we will comply with our obligations imposed by the Data Protection Laws:",
        "5.1 before or at the time of collecting Personal Data, we will identify the purposes for which information is being collected;",
        "5.2 we will only Process Personal Data for the purposes identified;",
        "5.3 we will respect your rights in relation to your Personal Data; and",
        "5.4 we will implement technical and organisational measures to ensure your Personal Data is secure.",
        "6. For any enquiries or complaints regarding data privacy, you can e-mail: privacy@sanfurniture.com.",
      ].join("\n\n"),
    },
    {
      id: "excluding-liability",
      title: "Excluding Liability",
      body: "1. The Supplier does not exclude liability for: (i) any fraudulent act or omission; or (ii) for death or personal injury caused by negligence or breach of the Supplier's other legal obligations. Subject to this, the Supplier is not liable for (i) loss which was not reasonably foreseeable to both parties at the time when the Contract was made, or (ii) loss (eg loss of profit) to the Customer's business, trade, craft or profession which would not be suffered by a Consumer - because the Supplier believes the Customer is not buying the Goods wholly or mainly for its business, trade, craft or profession.",
    },
    {
      id: "governing-law",
      title: "Governing Law, Jurisdiction and Complaints",
      body: [
        "1. The Contract (including any non-contractual matters) is governed by the law of England and Wales.",
        "2. Disputes can be submitted to the jurisdiction of the courts of England and Wales or, where the Customer lives in Scotland or Northern Ireland, in the courts of respectively Scotland or Northern Ireland.",
        "3. We try to avoid any dispute, so we deal with complaints in the following way: If a dispute occurs customers should contact us to find a solution. We will aim to respond with an appropriate solution within 5 days.",
      ].join("\n\n"),
    },
  ],
};

export const LEGAL_PRIVACY_DEFAULT_CONTENT: LegalPageCmsContent = {
  page_badge: "SAN Furniture Limited • UK GDPR & Cookie Law",
  page_title: "SAN Furniture Limited — Privacy Policy",
  page_subtitle:
    "Registered office: 112 Coventry Road, Exhall, West Midlands, CV7 9EU • Data Protection & Cookies Policy.",
  notice_title: "Privacy Notice",
  notice_body:
    "This Privacy Policy applies between you, the User of this Website, and SAN Furniture Limited, the owner and provider of this Website. SAN Furniture Limited takes the privacy of your information very seriously. This Privacy Policy applies to our use of any and all Data collected by us or provided by you in relation to your use of the Website. This Privacy Policy should be read alongside, and in addition to, our Terms and Conditions, which can be found at: https://www.sanfurniture.com/terms. Please read this Privacy Policy carefully.",
  sections: [
    {
      id: "definitions",
      title: "Definitions and Interpretation",
      body: [
        "1. In this Privacy Policy, the following definitions are used:",
        "| Term | Definition |",
        "| Data | collectively all information that you submit to SAN Furniture Limited via the Website. This definition incorporates, where applicable, the definitions provided in the Data Protection Laws; |",
        "| Cookies | a small text file placed on your computer by this Website when you visit certain parts of the Website and/or when you use certain features of the Website. Details of the cookies used by this Website are set out in the clause below (Cookies); |",
        "| Data Protection Laws | any applicable law relating to the processing of personal Data, including but not limited to the GDPR, and any national implementing and supplementary laws, regulations and secondary legislation; |",
        "| GDPR | the UK General Data Protection Regulation; |",
        "| SAN Furniture Limited, we or us | SAN Furniture Limited, a company incorporated in England and Wales with registered number 11733475 whose registered office is at 112 Coventry Road, Exhall, West Midlands, CV7 9EU; |",
        "| UK and EU Cookie Law | the Privacy and Electronic Communications (EC Directive) Regulations 2003 as amended by the Privacy and Electronic Communications (EC Directive) (Amendment) Regulations 2011 & the Privacy and Electronic Communications (EC Directive) (Amendment) Regulations 2018; |",
        "| User or you | any third party that accesses the Website and is not either (i) employed by SAN Furniture Limited and acting in the course of their employment or (ii) engaged as a consultant or otherwise providing services to SAN Furniture Limited and accessing the Website in connection with the provision of such services; and |",
        "| Website | the website that you are currently using, www.sanfurniture.com, and any sub-domains of this site, unless expressly excluded by their own terms and conditions. |",
        "",
        "2. In this Privacy Policy, unless the context requires a different interpretation:",
        "a. the singular includes the plural and vice versa;",
        "b. references to sub-clauses, clauses, schedules or appendices are to sub-clauses, clauses, schedules or appendices of this Privacy Policy;",
        "c. a reference to a person includes firms, companies, government entities, trusts and partnerships;",
        'd. "including" is understood to mean "including without limitation";',
        "e. reference to any statutory provision includes any modification or amendment of it;",
        "f. the headings and sub-headings do not form part of this Privacy Policy.",
      ].join("\n"),
    },
    {
      id: "scope",
      title: "Scope of this Privacy Policy",
      body: [
        "3. This Privacy Policy applies only to the actions of SAN Furniture Limited and Users with respect to this Website. It does not extend to any websites that can be accessed from this Website, including, but not limited to, any links we may provide to social media websites.",
        '4. For purposes of the applicable Data Protection Laws, SAN Furniture Limited is the "data controller". This means that SAN Furniture Limited determines the purposes for which, and the manner in which, your Data is processed.',
      ].join("\n\n"),
    },
    {
      id: "data-collected",
      title: "Data Collected",
      body: [
        "5. We may collect the following Data, which includes personal Data, from you:",
        "a. name;",
        "b. contact Information such as email addresses and telephone numbers;",
        "c. financial information such as credit / debit card numbers;",
        "in each case, in accordance with this Privacy Policy.",
      ].join("\n\n"),
    },
    {
      id: "how-we-collect-data",
      title: "How We Collect Data",
      body: [
        "6. We collect Data in the following ways:",
        "a. data is given to us by you; and",
        "b. data is collected automatically.",
      ].join("\n\n"),
    },
    {
      id: "data-given-by-you",
      title: "Data That is Given to Us by You",
      body: [
        "7. SAN Furniture Limited will collect your Data in a number of ways, for example:",
        "a. when you contact us through the Website, by telephone, post, e-mail or through any other means;",
        "b. when you register with us and set up an account to receive our products/services;",
        "c. when you make payments to us, through this Website or otherwise;",
        "in each case, in accordance with this Privacy Policy.",
      ].join("\n\n"),
    },
    {
      id: "data-collected-automatically",
      title: "Data That is Collected Automatically",
      body: [
        "8. To the extent that you access the Website, we will collect your Data automatically, for example:",
        "a. we automatically collect some information about your visit to the Website. This information helps us to make improvements to Website content and navigation, and includes your IP address, the date, times and frequency with which you access the Website and the way you use and interact with its content.",
        'b. we will collect your Data automatically via cookies, in line with the cookie settings on your browser. For more information about cookies, and how we use them on the Website, see the section below, headed "Cookies".',
      ].join("\n\n"),
    },
    {
      id: "our-use-of-data",
      title: "Our Use of Data",
      body: [
        "9. Any or all of the above Data may be required by us from time to time in order to provide you with the best possible service and experience when using our Website. Specifically, Data may be used by us for the following reasons:",
        "a. internal record keeping;",
        "b. improvement of our products / services;",
        "c. transmission by email of marketing materials that may be of interest to you;",
        "in each case, in accordance with this Privacy Policy.",
        '10. We may use your Data for the above purposes if we deem it necessary to do so for our legitimate interests. If you are not satisfied with this, you have the right to object in certain circumstances (see the section headed "Your rights" below).',
        "11. For the delivery of direct marketing to you via e-mail, we'll need your consent, whether via an opt-in or soft-opt-in:",
        'a. soft opt-in consent is a specific type of consent that applies when you have previously engaged with us (for example, you contact us to ask us for more details about a particular product/service, and we are marketing similar products/services). Under "soft opt-in" consent, we will take your consent as given unless you opt-out.',
        "b. for other types of e-marketing, we are required to obtain your explicit consent; that is, you need to take positive and affirmative action when consenting by, for example, checking a tick box that we'll provide.",
        'c. if you are not satisfied with our approach to marketing, you have the right to withdraw consent at any time. To find out how to withdraw your consent, see the section headed "Your rights" below.',
        "12. When you register with us and set up an account to receive our services, the legal basis for this processing is the performance of a contract between you and us and/or taking steps, at your request, to enter into such a contract.",
      ].join("\n\n"),
    },
    {
      id: "who-we-share-data-with",
      title: "Who We Share Data With",
      body: [
        "13. We may share your Data with the following groups of people for the following reasons:",
        "a. any of our group companies or affiliates - to ensure the proper administration of your website and business;",
        "b. our employees, agents and/or professional advisors - to obtain advice from professional advisers;",
        "c. relevant authorities - to facilitate the detection of crime or the collection of taxes or duties;",
        "in each case, in accordance with this Privacy Policy.",
      ].join("\n\n"),
    },
    {
      id: "keeping-data-secure",
      title: "Keeping Data Secure",
      body: [
        "14. We will use technical and organisational measures to safeguard your Data, for example:",
        "a. access to your account is controlled by a password and a user name that is unique to you.",
        "b. we store your Data on secure servers.",
        "c. payment details are encrypted using SSL technology (typically you will see a lock icon or green address bar (or both) in your browser when we use this technology).",
        "15. Technical and organisational measures include measures to deal with any suspected data breach. If you suspect any misuse or loss or unauthorised access to your Data, please let us know immediately by contacting us via this e-mail address: privacy@sanfurniture.com.",
        "16. If you want detailed information from Get Safe Online on how to protect your information and your computers and devices against fraud, identity theft, viruses and many other online problems, please visit www.getsafeonline.org. Get Safe Online is supported by HM Government and leading businesses.",
      ].join("\n\n"),
    },
    {
      id: "data-retention",
      title: "Data Retention",
      body: [
        "17. Unless a longer retention period is required or permitted by law, we will only hold your Data on our systems for the period necessary to fulfil the purposes outlined in this Privacy Policy or until you request that the Data be deleted.",
        "18. Even if we delete your Data, it may persist on backup or archival media for legal, tax or regulatory purposes.",
      ].join("\n\n"),
    },
    {
      id: "your-rights",
      title: "Your Rights",
      body: [
        "19. You have the following rights in relation to your Data:",
        'a. **Right to access** – the right to request (i) copies of the information we hold about you at any time, or (ii) that we modify, update or delete such information. If we provide you with access to the information we hold about you, we will not charge you for this, unless your request is "manifestly unfounded or excessive." Where we are legally permitted to do so, we may refuse your request. If we refuse your request, we will tell you the reasons why.',
        "b. **Right to correct** – the right to have your Data rectified if it is inaccurate or incomplete.",
        "c. **Right to erase** – the right to request that we delete or remove your Data from our systems.",
        'd. **Right to restrict our use of your Data** – the right to "block" us from using your Data or limit the way in which we can use it.',
        "e. **Right to data portability** – the right to request that we move, copy or transfer your Data.",
        "f. **Right to object** – the right to object to our use of your Data, including where we use it for our legitimate interests.",
        "g. **Right to complain** – the right to raise a complaint with us directly about how we handle your Data.",
        "20. To make enquiries, exercise any of your rights set out above, or withdraw your consent to the processing of your Data (where consent is our legal basis for processing your Data), please contact us via this e-mail address: privacy@sanfurniture.com.",
        "21. If you have a complaint about how we handle your Data, please contact us in the first instance via this e-mail address: privacy@sanfurniture.com. We will acknowledge your complaint within 30 days, investigate and respond without undue delay and inform you of the outcome.",
        "a. If you are not satisfied with the way your complaint is handled by us, you may refer your complaint to the relevant data protection authority. For the UK, this is the Information Commissioner's Office (ICO). The ICO's contact details can be found on their website at https://ico.org.uk/.",
        "22. It is important that the Data we hold about you is accurate and current. Please keep us informed if your Data changes during the period for which we hold it.",
      ].join("\n\n"),
    },
    {
      id: "links-to-other-websites",
      title: "Links to Other Websites",
      body: "23. This Website may, from time to time, provide links to other websites. We have no control over such websites and are not responsible for the content of these websites. This Privacy Policy does not extend to your use of such websites. You are advised to read the Privacy Policy or statement of other websites prior to using them.",
    },
    {
      id: "business-ownership",
      title: "Changes of Business Ownership and Control",
      body: [
        "24. SAN Furniture Limited may, from time to time, expand or reduce our business and this may involve the sale and/or the transfer of control of all or part of SAN Furniture Limited. Data provided by Users will, where it is relevant to any part of our business so transferred, be transferred along with that part and the new owner or newly controlling party will, under the terms of this Privacy Policy, be permitted to use the Data for the purposes for which it was originally supplied to us.",
        "25. We may also disclose Data to a prospective purchaser of our business or any part of it.",
        "26. In the above instances, we will take steps with the aim of ensuring your privacy is protected.",
      ].join("\n\n"),
    },
    {
      id: "cookies",
      title: "Cookies",
      body: [
        "27. This Website may place and access certain Cookies on your computer. SAN Furniture Limited uses Cookies to improve your experience of using the Website and to improve our range of products. SAN Furniture Limited has carefully chosen these Cookies and has taken steps to ensure that your privacy is protected and respected at all times.",
        "28. All Cookies used by this Website are used in accordance with current UK and EU Cookie Law.",
        "29. Before the Website places Cookies on your computer, you will be presented with a message bar requesting your consent to set those Cookies. By giving your consent to the placing of Cookies, you are enabling SAN Furniture Limited to provide a better experience and service to you. You may, if you wish, deny consent to the placing of Cookies; however certain features of the Website may not function fully or as intended.",
        "30. This Website may place the following Cookies:",
        "| Type of Cookie | Purpose |",
        "| Strictly necessary cookies | These are cookies that are required for the operation of our website. They include, for example, cookies that enable you to log into secure areas of our website, use a shopping cart or make use of e-billing services. |",
        "| Analytical/performance cookies | They allow us to recognise and count the number of visitors and to see how visitors move around our website when they are using it. This helps us to improve the way our website works, for example, by ensuring that users are finding what they are looking for easily. |",
        "| Functionality cookies | These are used to recognise you when you return to our website. This enables us to personalise our content for you, greet you by name and remember your preferences (for example, your choice of language or region). By using the Website, you agree to our placement of functionality cookie. |",
        "",
        "31. You can find a list of Cookies that we use in the Cookies Schedule.",
        "32. We give you control over which Cookies we use. You can adjust your cookies preferences at any time at: [[COOKIE_PREFERENCES_BUTTON]]",
        "33. You can also choose to enable or disable Cookies in your internet browser. By default, most internet browsers accept Cookies, but this can be changed. For further details, please see the help menu in your internet browser. You can switch off Cookies at any time, however, you may lose any information that enables you to access the Website more quickly and efficiently.",
        "34. You can choose to delete Cookies at any time; however, you may lose any information that enables you to access the Website more quickly and efficiently including, but not limited to, personalisation settings.",
        "35. It is recommended that you ensure that your internet browser is up-to-date and that you consult the help and guidance provided by the developer of your internet browser if you are unsure about adjusting your privacy settings.",
        "36. For more information generally on cookies, including how to disable them, please refer to aboutcookies.org. You will also find details on how to delete cookies from your computer.",
      ].join("\n"),
    },
    {
      id: "general",
      title: "General",
      body: [
        "37. You may not transfer any of your rights under this Privacy Policy to any other person. We may transfer our rights under this Privacy Policy where we reasonably believe your rights will not be affected.",
        "38. If any court or competent authority finds that any provision of this Privacy Policy (or part of any provision) is invalid, illegal or unenforceable, that provision or part-provision will, to the extent required, be deemed to be deleted, and the validity and enforceability of the other provisions of this Privacy Policy will not be affected.",
        "39. Unless otherwise agreed, no delay, act or omission by a party in exercising any right or remedy will be deemed a waiver of that, or any other, right or remedy.",
        "40. This Agreement will be governed by and interpreted according to the law of England and Wales. All disputes arising under the Agreement will be subject to the exclusive jurisdiction of the English and Welsh courts.",
      ].join("\n\n"),
    },
    {
      id: "changes-to-policy",
      title: "Changes to This Privacy Policy",
      body: [
        "41. SAN Furniture Limited reserves the right to change this Privacy Policy as we may deem necessary from time to time or as may be required by law. Any changes will be immediately posted on the Website and you are deemed to have accepted the terms of the Privacy Policy on your first use of the Website following the alterations.",
        "42. You may contact SAN Furniture Limited by email at privacy@sanfurniture.com.",
      ].join("\n\n"),
    },
    {
      id: "cookies-schedule",
      title: "Cookies Schedule",
      body: [
        "Below is a list of the cookies that we use. We have tried to ensure this is complete and up to date, but if you think that we have missed a cookie or there is any discrepancy, please let us know.",
        "",
        "### Strictly necessary",
        "We use the following strictly necessary cookies:",
        "| Description | Purpose |",
        "| We use this session cookie to remember you and maintain your session whilst you are using our website. | — |",
        "",
        "### Functionality",
        "We use the following functionality cookies:",
        "| Description | Purpose |",
        "| We use this cookie to identify your computer and analyse traffic patterns on our website. | — |",
        "",
        "### Analytical/Performance",
        "We use the following analytical/performance cookies:",
        "| Description | Purpose |",
        "| We use this cookie to help us analyse how users use the website. | — |",
      ].join("\n"),
    },
  ],
};
