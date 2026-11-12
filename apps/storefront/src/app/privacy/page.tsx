import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import {
  LegalDocumentLayout,
  LegalSectionCard,
  LegalClause,
  LegalTable,
  type LegalNavItem,
} from "@/components/legal/LegalDocumentLayout";
import { CookiePreferencesButton } from "@/components/legal/CookiePreferencesButton";

export const metadata: Metadata = {
  title: "Privacy Policy & Cookies Schedule | SAN Furniture Limited",
  description:
    "Privacy Policy and Cookies Schedule of SAN Furniture Limited (Company No. 11733475) in accordance with UK GDPR, Data Protection Laws, and UK and EU Cookie Law.",
};

const PRIVACY_NAV_ITEMS: LegalNavItem[] = [
  { id: "definitions", label: "Definitions and Interpretation" },
  { id: "scope", label: "Scope of this Privacy Policy" },
  { id: "data-collected", label: "Data Collected" },
  { id: "how-we-collect-data", label: "How We Collect Data" },
  { id: "data-given-by-you", label: "Data That is Given to Us by You" },
  { id: "data-collected-automatically", label: "Data That is Collected Automatically" },
  { id: "our-use-of-data", label: "Our Use of Data" },
  { id: "who-we-share-data-with", label: "Who We Share Data With" },
  { id: "keeping-data-secure", label: "Keeping Data Secure" },
  { id: "data-retention", label: "Data Retention" },
  { id: "your-rights", label: "Your Rights" },
  { id: "links-to-other-websites", label: "Links to Other Websites" },
  { id: "business-ownership", label: "Changes of Business Ownership and Control" },
  { id: "cookies", label: "Cookies" },
  { id: "general", label: "General" },
  { id: "changes-to-policy", label: "Changes to This Privacy Policy" },
  { id: "cookies-schedule", label: "Cookies Schedule" },
];

const DEFINITIONS_ROWS = [
  [
    "Data",
    "collectively all information that you submit to SAN Furniture Limited via the Website. This definition incorporates, where applicable, the definitions provided in the Data Protection Laws;",
  ],
  [
    "Cookies",
    "a small text file placed on your computer by this Website when you visit certain parts of the Website and/or when you use certain features of the Website. Details of the cookies used by this Website are set out in the clause below (Cookies);",
  ],
  [
    "Data Protection Laws",
    "any applicable law relating to the processing of personal Data, including but not limited to the GDPR, and any national implementing and supplementary laws, regulations and secondary legislation;",
  ],
  ["GDPR", "the UK General Data Protection Regulation;"],
  [
    "SAN Furniture Limited, we or us",
    "SAN Furniture Limited, a company incorporated in England and Wales with registered number 11733475 whose registered office is at 112 Coventry Road, Exhall, West Midlands, CV7 9EU;",
  ],
  [
    "UK and EU Cookie Law",
    "the Privacy and Electronic Communications (EC Directive) Regulations 2003 as amended by the Privacy and Electronic Communications (EC Directive) (Amendment) Regulations 2011 & the Privacy and Electronic Communications (EC Directive) (Amendment) Regulations 2018;",
  ],
  [
    "User or you",
    "any third party that accesses the Website and is not either (i) employed by SAN Furniture Limited and acting in the course of their employment or (ii) engaged as a consultant or otherwise providing services to SAN Furniture Limited and accessing the Website in connection with the provision of such services; and",
  ],
  [
    "Website",
    "the website that you are currently using, www.sanfurniture.com, and any sub-domains of this site, unless expressly excluded by their own terms and conditions.",
  ],
] as const;

const COOKIE_TYPES_ROWS = [
  [
    "Strictly necessary cookies",
    "These are cookies that are required for the operation of our website. They include, for example, cookies that enable you to log into secure areas of our website, use a shopping cart or make use of e-billing services.",
  ],
  [
    "Analytical/performance cookies",
    "They allow us to recognise and count the number of visitors and to see how visitors move around our website when they are using it. This helps us to improve the way our website works, for example, by ensuring that users are finding what they are looking for easily.",
  ],
  [
    "Functionality cookies",
    "These are used to recognise you when you return to our website. This enables us to personalise our content for you, greet you by name and remember your preferences (for example, your choice of language or region). By using the Website, you agree to our placement of functionality cookie.",
  ],
] as const;

export default function PrivacyPage() {
  return (
    <LegalDocumentLayout
      breadcrumbLabel="Privacy Policy"
      badgeIcon={<ShieldCheck className="w-3.5 h-3.5 text-brass-600" />}
      badgeText="SAN Furniture Limited • UK GDPR & Cookie Law"
      title="SAN Furniture Limited — Privacy Policy"
      subtitle="Registered office: 112 Coventry Road, Exhall, West Midlands, CV7 9EU • Data Protection & Cookies Policy."
      noticeTitle="Privacy Notice"
      noticeBody={
        <p>
          This Privacy Policy applies between you, the User of this Website, and SAN Furniture Limited, the owner and
          provider of this Website. SAN Furniture Limited takes the privacy of your information very seriously. This
          Privacy Policy applies to our use of any and all Data collected by us or provided by you in relation to your
          use of the Website. This Privacy Policy should be read alongside, and in addition to, our Terms and
          Conditions, which can be found at:{" "}
          <Link href="/terms" className="font-semibold text-brass-700 underline hover:text-brass-900">
            https://www.sanfurniture.com/terms
          </Link>
          . Please read this Privacy Policy carefully.
        </p>
      }
      navItems={PRIVACY_NAV_ITEMS}
    >
      <LegalSectionCard id="definitions" title="Definitions and Interpretation">
        <LegalClause num="1.">
          <p>In this Privacy Policy, the following definitions are used:</p>
          <LegalTable headers={["Term", "Definition"]} rows={DEFINITIONS_ROWS} />
        </LegalClause>

        <LegalClause num="2.">
          <p>In this Privacy Policy, unless the context requires a different interpretation:</p>
          <LegalClause num="a." indent>
            <p>the singular includes the plural and vice versa;</p>
          </LegalClause>
          <LegalClause num="b." indent>
            <p>
              references to sub-clauses, clauses, schedules or appendices are to sub-clauses, clauses, schedules or
              appendices of this Privacy Policy;
            </p>
          </LegalClause>
          <LegalClause num="c." indent>
            <p>a reference to a person includes firms, companies, government entities, trusts and partnerships;</p>
          </LegalClause>
          <LegalClause num="d." indent>
            <p>&quot;including&quot; is understood to mean &quot;including without limitation&quot;;</p>
          </LegalClause>
          <LegalClause num="e." indent>
            <p>reference to any statutory provision includes any modification or amendment of it;</p>
          </LegalClause>
          <LegalClause num="f." indent>
            <p>the headings and sub-headings do not form part of this Privacy Policy.</p>
          </LegalClause>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="scope" title="Scope of this Privacy Policy">
        <LegalClause num="3.">
          <p>
            This Privacy Policy applies only to the actions of SAN Furniture Limited and Users with respect to this
            Website. It does not extend to any websites that can be accessed from this Website, including, but not
            limited to, any links we may provide to social media websites.
          </p>
        </LegalClause>
        <LegalClause num="4.">
          <p>
            For purposes of the applicable Data Protection Laws, SAN Furniture Limited is the &quot;data
            controller&quot;. This means that SAN Furniture Limited determines the purposes for which, and the manner
            in which, your Data is processed.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="data-collected" title="Data Collected">
        <LegalClause num="5.">
          <p>We may collect the following Data, which includes personal Data, from you:</p>
          <LegalClause num="a." indent>
            <p>name;</p>
          </LegalClause>
          <LegalClause num="b." indent>
            <p>contact Information such as email addresses and telephone numbers;</p>
          </LegalClause>
          <LegalClause num="c." indent>
            <p>financial information such as credit / debit card numbers;</p>
          </LegalClause>
          <p>in each case, in accordance with this Privacy Policy.</p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="how-we-collect-data" title="How We Collect Data">
        <LegalClause num="6.">
          <p>We collect Data in the following ways:</p>
          <LegalClause num="a." indent>
            <p>data is given to us by you; and</p>
          </LegalClause>
          <LegalClause num="b." indent>
            <p>data is collected automatically.</p>
          </LegalClause>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="data-given-by-you" title="Data That is Given to Us by You">
        <LegalClause num="7.">
          <p>SAN Furniture Limited will collect your Data in a number of ways, for example:</p>
          <LegalClause num="a." indent>
            <p>when you contact us through the Website, by telephone, post, e-mail or through any other means;</p>
          </LegalClause>
          <LegalClause num="b." indent>
            <p>when you register with us and set up an account to receive our products/services;</p>
          </LegalClause>
          <LegalClause num="c." indent>
            <p>when you make payments to us, through this Website or otherwise;</p>
          </LegalClause>
          <p>in each case, in accordance with this Privacy Policy.</p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="data-collected-automatically" title="Data That is Collected Automatically">
        <LegalClause num="8.">
          <p>To the extent that you access the Website, we will collect your Data automatically, for example:</p>
          <LegalClause num="a." indent>
            <p>
              we automatically collect some information about your visit to the Website. This information helps us to
              make improvements to Website content and navigation, and includes your IP address, the date, times and
              frequency with which you access the Website and the way you use and interact with its content.
            </p>
          </LegalClause>
          <LegalClause num="b." indent>
            <p>
              we will collect your Data automatically via cookies, in line with the cookie settings on your browser.
              For more information about cookies, and how we use them on the Website, see the section below, headed
              &quot;Cookies&quot;.
            </p>
          </LegalClause>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="our-use-of-data" title="Our Use of Data">
        <LegalClause num="9.">
          <p>
            Any or all of the above Data may be required by us from time to time in order to provide you with the best
            possible service and experience when using our Website. Specifically, Data may be used by us for the
            following reasons:
          </p>
          <LegalClause num="a." indent>
            <p>internal record keeping;</p>
          </LegalClause>
          <LegalClause num="b." indent>
            <p>improvement of our products / services;</p>
          </LegalClause>
          <LegalClause num="c." indent>
            <p>transmission by email of marketing materials that may be of interest to you;</p>
          </LegalClause>
          <p>in each case, in accordance with this Privacy Policy.</p>
        </LegalClause>
        <LegalClause num="10.">
          <p>
            We may use your Data for the above purposes if we deem it necessary to do so for our legitimate interests.
            If you are not satisfied with this, you have the right to object in certain circumstances (see the section
            headed &quot;Your rights&quot; below).
          </p>
        </LegalClause>
        <LegalClause num="11.">
          <p>
            For the delivery of direct marketing to you via e-mail, we&apos;ll need your consent, whether via an opt-in
            or soft-opt-in:
          </p>
          <LegalClause num="a." indent>
            <p>
              soft opt-in consent is a specific type of consent that applies when you have previously engaged with us
              (for example, you contact us to ask us for more details about a particular product/service, and we are
              marketing similar products/services). Under &quot;soft opt-in&quot; consent, we will take your consent as
              given unless you opt-out.
            </p>
          </LegalClause>
          <LegalClause num="b." indent>
            <p>
              for other types of e-marketing, we are required to obtain your explicit consent; that is, you need to
              take positive and affirmative action when consenting by, for example, checking a tick box that we&apos;ll
              provide.
            </p>
          </LegalClause>
          <LegalClause num="c." indent>
            <p>
              if you are not satisfied with our approach to marketing, you have the right to withdraw consent at any
              time. To find out how to withdraw your consent, see the section headed &quot;Your rights&quot; below.
            </p>
          </LegalClause>
        </LegalClause>
        <LegalClause num="12.">
          <p>
            When you register with us and set up an account to receive our services, the legal basis for this
            processing is the performance of a contract between you and us and/or taking steps, at your request, to
            enter into such a contract.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="who-we-share-data-with" title="Who We Share Data With">
        <LegalClause num="13.">
          <p>We may share your Data with the following groups of people for the following reasons:</p>
          <LegalClause num="a." indent>
            <p>
              any of our group companies or affiliates - to ensure the proper administration of your website and
              business;
            </p>
          </LegalClause>
          <LegalClause num="b." indent>
            <p>our employees, agents and/or professional advisors - to obtain advice from professional advisers;</p>
          </LegalClause>
          <LegalClause num="c." indent>
            <p>relevant authorities - to facilitate the detection of crime or the collection of taxes or duties;</p>
          </LegalClause>
          <p>in each case, in accordance with this Privacy Policy.</p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="keeping-data-secure" title="Keeping Data Secure">
        <LegalClause num="14.">
          <p>We will use technical and organisational measures to safeguard your Data, for example:</p>
          <LegalClause num="a." indent>
            <p>access to your account is controlled by a password and a user name that is unique to you.</p>
          </LegalClause>
          <LegalClause num="b." indent>
            <p>we store your Data on secure servers.</p>
          </LegalClause>
          <LegalClause num="c." indent>
            <p>
              payment details are encrypted using SSL technology (typically you will see a lock icon or green address
              bar (or both) in your browser when we use this technology).
            </p>
          </LegalClause>
        </LegalClause>
        <LegalClause num="15.">
          <p>
            Technical and organisational measures include measures to deal with any suspected data breach. If you
            suspect any misuse or loss or unauthorised access to your Data, please let us know immediately by
            contacting us via this e-mail address:{" "}
            <a href="mailto:privacy@sanfurniture.com" className="text-brass-700 underline hover:text-brass-900">
              privacy@sanfurniture.com
            </a>
            .
          </p>
        </LegalClause>
        <LegalClause num="16.">
          <p>
            If you want detailed information from Get Safe Online on how to protect your information and your computers
            and devices against fraud, identity theft, viruses and many other online problems, please visit{" "}
            <a
              href="https://www.getsafeonline.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brass-700 underline hover:text-brass-900"
            >
              www.getsafeonline.org
            </a>
            . Get Safe Online is supported by HM Government and leading businesses.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="data-retention" title="Data Retention">
        <LegalClause num="17.">
          <p>
            Unless a longer retention period is required or permitted by law, we will only hold your Data on our
            systems for the period necessary to fulfil the purposes outlined in this Privacy Policy or until you request
            that the Data be deleted.
          </p>
        </LegalClause>
        <LegalClause num="18.">
          <p>
            Even if we delete your Data, it may persist on backup or archival media for legal, tax or regulatory
            purposes.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="your-rights" title="Your Rights">
        <LegalClause num="19.">
          <p>You have the following rights in relation to your Data:</p>
          <LegalClause num="a." indent>
            <p>
              <strong>Right to access</strong> – the right to request (i) copies of the information we hold about you
              at any time, or (ii) that we modify, update or delete such information. If we provide you with access to
              the information we hold about you, we will not charge you for this, unless your request is &quot;manifestly
              unfounded or excessive.&quot; Where we are legally permitted to do so, we may refuse your request. If we
              refuse your request, we will tell you the reasons why.
            </p>
          </LegalClause>
          <LegalClause num="b." indent>
            <p>
              <strong>Right to correct</strong> – the right to have your Data rectified if it is inaccurate or
              incomplete.
            </p>
          </LegalClause>
          <LegalClause num="c." indent>
            <p>
              <strong>Right to erase</strong> – the right to request that we delete or remove your Data from our
              systems.
            </p>
          </LegalClause>
          <LegalClause num="d." indent>
            <p>
              <strong>Right to restrict our use of your Data</strong> – the right to &quot;block&quot; us from using
              your Data or limit the way in which we can use it.
            </p>
          </LegalClause>
          <LegalClause num="e." indent>
            <p>
              <strong>Right to data portability</strong> – the right to request that we move, copy or transfer your
              Data.
            </p>
          </LegalClause>
          <LegalClause num="f." indent>
            <p>
              <strong>Right to object</strong> – the right to object to our use of your Data, including where we use it
              for our legitimate interests.
            </p>
          </LegalClause>
          <LegalClause num="g." indent>
            <p>
              <strong>Right to complain</strong> – the right to raise a complaint with us directly about how we handle
              your Data.
            </p>
          </LegalClause>
        </LegalClause>
        <LegalClause num="20.">
          <p>
            To make enquiries, exercise any of your rights set out above, or withdraw your consent to the processing of
            your Data (where consent is our legal basis for processing your Data), please contact us via this e-mail
            address:{" "}
            <a href="mailto:privacy@sanfurniture.com" className="text-brass-700 underline hover:text-brass-900">
              privacy@sanfurniture.com
            </a>
            .
          </p>
        </LegalClause>
        <LegalClause num="21.">
          <p>
            If you have a complaint about how we handle your Data, please contact us in the first instance via this
            e-mail address:{" "}
            <a href="mailto:privacy@sanfurniture.com" className="text-brass-700 underline hover:text-brass-900">
              privacy@sanfurniture.com
            </a>
            . We will acknowledge your complaint within 30 days, investigate and respond without undue delay and inform
            you of the outcome.
          </p>
          <LegalClause num="a." indent>
            <p>
              If you are not satisfied with the way your complaint is handled by us, you may refer your complaint to
              the relevant data protection authority. For the UK, this is the Information Commissioner&apos;s Office
              (ICO). The ICO&apos;s contact details can be found on their website at{" "}
              <a
                href="https://ico.org.uk/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brass-700 underline hover:text-brass-900"
              >
                https://ico.org.uk/
              </a>
              .
            </p>
          </LegalClause>
        </LegalClause>
        <LegalClause num="22.">
          <p>
            It is important that the Data we hold about you is accurate and current. Please keep us informed if your
            Data changes during the period for which we hold it.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="links-to-other-websites" title="Links to Other Websites">
        <LegalClause num="23.">
          <p>
            This Website may, from time to time, provide links to other websites. We have no control over such websites
            and are not responsible for the content of these websites. This Privacy Policy does not extend to your use
            of such websites. You are advised to read the Privacy Policy or statement of other websites prior to using
            them.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="business-ownership" title="Changes of Business Ownership and Control">
        <LegalClause num="24.">
          <p>
            SAN Furniture Limited may, from time to time, expand or reduce our business and this may involve the sale
            and/or the transfer of control of all or part of SAN Furniture Limited. Data provided by Users will, where
            it is relevant to any part of our business so transferred, be transferred along with that part and the new
            owner or newly controlling party will, under the terms of this Privacy Policy, be permitted to use the Data
            for the purposes for which it was originally supplied to us.
          </p>
        </LegalClause>
        <LegalClause num="25.">
          <p>We may also disclose Data to a prospective purchaser of our business or any part of it.</p>
        </LegalClause>
        <LegalClause num="26.">
          <p>In the above instances, we will take steps with the aim of ensuring your privacy is protected.</p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="cookies" title="Cookies">
        <LegalClause num="27.">
          <p>
            This Website may place and access certain Cookies on your computer. SAN Furniture Limited uses Cookies to
            improve your experience of using the Website and to improve our range of products. SAN Furniture Limited
            has carefully chosen these Cookies and has taken steps to ensure that your privacy is protected and
            respected at all times.
          </p>
        </LegalClause>
        <LegalClause num="28.">
          <p>All Cookies used by this Website are used in accordance with current UK and EU Cookie Law.</p>
        </LegalClause>
        <LegalClause num="29.">
          <p>
            Before the Website places Cookies on your computer, you will be presented with a message bar requesting your
            consent to set those Cookies. By giving your consent to the placing of Cookies, you are enabling SAN
            Furniture Limited to provide a better experience and service to you. You may, if you wish, deny consent to
            the placing of Cookies; however certain features of the Website may not function fully or as intended.
          </p>
        </LegalClause>
        <LegalClause num="30.">
          <p>This Website may place the following Cookies:</p>
          <LegalTable headers={["Type of Cookie", "Purpose"]} rows={COOKIE_TYPES_ROWS} />
        </LegalClause>
        <LegalClause num="31.">
          <p>
            You can find a list of Cookies that we use in the{" "}
            <a href="#cookies-schedule" className="text-brass-700 underline hover:text-brass-900">
              Cookies Schedule
            </a>
            .
          </p>
        </LegalClause>
        <LegalClause num="32.">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              We give you control over which Cookies we use. You can adjust your cookies preferences at any time at:
            </span>
            <CookiePreferencesButton label="Cookie Preferences" />
          </div>
        </LegalClause>
        <LegalClause num="33.">
          <p>
            You can also choose to enable or disable Cookies in your internet browser. By default, most internet
            browsers accept Cookies, but this can be changed. For further details, please see the help menu in your
            internet browser. You can switch off Cookies at any time, however, you may lose any information that
            enables you to access the Website more quickly and efficiently.
          </p>
        </LegalClause>
        <LegalClause num="34.">
          <p>
            You can choose to delete Cookies at any time; however, you may lose any information that enables you to
            access the Website more quickly and efficiently including, but not limited to, personalisation settings.
          </p>
        </LegalClause>
        <LegalClause num="35.">
          <p>
            It is recommended that you ensure that your internet browser is up-to-date and that you consult the help
            and guidance provided by the developer of your internet browser if you are unsure about adjusting your
            privacy settings.
          </p>
        </LegalClause>
        <LegalClause num="36.">
          <p>
            For more information generally on cookies, including how to disable them, please refer to{" "}
            <a
              href="https://www.aboutcookies.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brass-700 underline hover:text-brass-900"
            >
              aboutcookies.org
            </a>
            . You will also find details on how to delete cookies from your computer.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="general" title="General">
        <LegalClause num="37.">
          <p>
            You may not transfer any of your rights under this Privacy Policy to any other person. We may transfer our
            rights under this Privacy Policy where we reasonably believe your rights will not be affected.
          </p>
        </LegalClause>
        <LegalClause num="38.">
          <p>
            If any court or competent authority finds that any provision of this Privacy Policy (or part of any
            provision) is invalid, illegal or unenforceable, that provision or part-provision will, to the extent
            required, be deemed to be deleted, and the validity and enforceability of the other provisions of this
            Privacy Policy will not be affected.
          </p>
        </LegalClause>
        <LegalClause num="39.">
          <p>
            Unless otherwise agreed, no delay, act or omission by a party in exercising any right or remedy will be
            deemed a waiver of that, or any other, right or remedy.
          </p>
        </LegalClause>
        <LegalClause num="40.">
          <p>
            This Agreement will be governed by and interpreted according to the law of England and Wales. All disputes
            arising under the Agreement will be subject to the exclusive jurisdiction of the English and Welsh courts.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="changes-to-policy" title="Changes to This Privacy Policy">
        <LegalClause num="41.">
          <p>
            SAN Furniture Limited reserves the right to change this Privacy Policy as we may deem necessary from time
            to time or as may be required by law. Any changes will be immediately posted on the Website and you are
            deemed to have accepted the terms of the Privacy Policy on your first use of the Website following the
            alterations.
          </p>
        </LegalClause>
        <LegalClause num="42.">
          <p>
            You may contact SAN Furniture Limited by email at{" "}
            <a href="mailto:privacy@sanfurniture.com" className="text-brass-700 underline hover:text-brass-900">
              privacy@sanfurniture.com
            </a>
            .
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="cookies-schedule" title="Cookies Schedule">
        <p>
          Below is a list of the cookies that we use. We have tried to ensure this is complete and up to date, but if
          you think that we have missed a cookie or there is any discrepancy, please let us know.
        </p>

        <div className="space-y-3 pt-2">
          <h3 className="font-display text-base font-bold text-navy-950">Strictly necessary</h3>
          <p>We use the following strictly necessary cookies:</p>
          <LegalTable
            headers={["Description", "Purpose"]}
            narrowFirstColumn={false}
            rows={[
              [
                "We use this session cookie to remember you and maintain your session whilst you are using our website.",
                "—",
              ],
            ]}
          />
        </div>

        <div className="space-y-3 pt-2">
          <h3 className="font-display text-base font-bold text-navy-950">Functionality</h3>
          <p>We use the following functionality cookies:</p>
          <LegalTable
            headers={["Description", "Purpose"]}
            narrowFirstColumn={false}
            rows={[
              ["We use this cookie to identify your computer and analyse traffic patterns on our website.", "—"],
            ]}
          />
        </div>

        <div className="space-y-3 pt-2">
          <h3 className="font-display text-base font-bold text-navy-950">Analytical/Performance</h3>
          <p>We use the following analytical/performance cookies:</p>
          <LegalTable
            headers={["Description", "Purpose"]}
            narrowFirstColumn={false}
            rows={[["We use this cookie to help us analyse how users use the website.", "—"]]}
          />
        </div>
      </LegalSectionCard>
    </LegalDocumentLayout>
  );
}
