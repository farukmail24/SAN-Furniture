import type { Metadata } from "next";
import Link from "next/link";
import { Scale } from "lucide-react";
import {
  LegalDocumentLayout,
  LegalSectionCard,
  LegalClause,
  type LegalNavItem,
} from "@/components/legal/LegalDocumentLayout";

export const metadata: Metadata = {
  title: "Terms and Conditions | SAN Furniture Limited",
  description:
    "Terms and Conditions of SAN Furniture Limited (Company No. 11733475) governing orders, delivery, cancellations, conformity, privacy, and UK consumer rights.",
};

const TERMS_NAV_ITEMS: LegalNavItem[] = [
  { id: "application", label: "Application" },
  { id: "interpretation", label: "Interpretation" },
  { id: "goods", label: "Goods" },
  { id: "personal-information", label: "Personal Information and Registration" },
  { id: "basis-of-sale", label: "Basis of Sale" },
  { id: "price-and-payment", label: "Price and Payment" },
  { id: "delivery", label: "Delivery" },
  { id: "risk-and-title", label: "Risk and Title" },
  { id: "withdrawal-returns", label: "Withdrawal, Returns and Cancellation" },
  { id: "right-to-cancel", label: "Right to Cancel" },
  { id: "effects-of-cancellation", label: "Effects of Cancellation in the Cancellation Period" },
  { id: "deduction-for-goods", label: "Deduction for Goods Supplied" },
  { id: "timing-of-reimbursement", label: "Timing of Reimbursement" },
  { id: "returning-goods", label: "Returning Goods" },
  { id: "conformity", label: "Conformity" },
  { id: "successors-subcontractors", label: "Successors and Our Sub-Contractors" },
  { id: "circumstances-beyond-control", label: "Circumstances Beyond the Control of Either Party" },
  { id: "privacy", label: "Privacy" },
  { id: "excluding-liability", label: "Excluding Liability" },
  { id: "governing-law", label: "Governing Law, Jurisdiction and Complaints" },
];

export default function TermsPage() {
  return (
    <LegalDocumentLayout
      breadcrumbLabel="Terms and Conditions"
      badgeIcon={<Scale className="w-3.5 h-3.5 text-brass-600" />}
      badgeText="SAN Furniture Limited • Company No. 11733475"
      title="SAN Furniture Limited — Terms and Conditions"
      subtitle="Registered office: 112 Coventry Road, Exhall, West Midlands, CV7 9EU • Registered in England and Wales."
      noticeTitle="Important Notice"
      noticeBody={
        <p>
          Please read all these Terms and Conditions. As we can accept your order and make a legally
          enforceable agreement without further reference to you, you must read these Terms and Conditions
          to make sure that they contain all that you want and nothing that you are not happy with. If you
          are not sure about anything, just phone us on{" "}
          <a href="tel:+442031503472" className="font-semibold text-brass-700 underline hover:text-brass-900">
            +4420 3150 3472
          </a>
          .
        </p>
      }
      navItems={TERMS_NAV_ITEMS}
    >
      <LegalSectionCard id="application" title="Application">
        <LegalClause num="1.">
          <p>
            These Terms and Conditions will apply to the purchase of the goods by you (the Customer or you). We are
            SAN Furniture Limited a company registered in England and Wales under number 11733475 whose registered
            office is at 112 Coventry Road, Exhall, West Midlands, CV7 9EU with email address{" "}
            <a href="mailto:privacy@sanfurniture.com" className="text-brass-700 underline hover:text-brass-900">
              privacy@sanfurniture.com
            </a>
            ; telephone number{" "}
            <a href="tel:+442031503472" className="text-brass-700 underline hover:text-brass-900">
              +4420 3150 3472
            </a>
            ; (the Supplier or us or we).
          </p>
        </LegalClause>
        <LegalClause num="2.">
          <p>
            These are the terms on which we sell all Goods to you. By ordering any of the Goods, you agree to be
            bound by these Terms and Conditions. Before placing an order on the Website, you will be asked to agree
            to these Terms and Conditions by clicking on the button marked &apos;I Accept&apos;. If you do not click
            on the button, you will not be able to complete your Order. You can only purchase the Goods from the
            Website if you are eligible to enter into a contract and are at least 18 years old.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="interpretation" title="Interpretation">
        <LegalClause num="1.">
          <p>
            <strong>Consumer</strong> means an individual acting for purposes which are wholly or mainly outside
            their trade, business, craft or profession;
          </p>
        </LegalClause>
        <LegalClause num="2.">
          <p>
            <strong>Contract</strong> means the legally-binding agreement between you and us for the supply of the
            Goods;
          </p>
        </LegalClause>
        <LegalClause num="3.">
          <p>
            <strong>Delivery Location</strong> means the Supplier&apos;s premises or other location where the Goods
            are to be supplied, as set out in the Order;
          </p>
        </LegalClause>
        <LegalClause num="4.">
          <p>
            <strong>Durable Medium</strong> means paper or email, or any other medium that allows information to be
            addressed personally to the recipient, enables the recipient to store the information in a way accessible
            for future reference for a period that is long enough for the purposes of the information, and allows
            the unchanged reproduction of the information stored;
          </p>
        </LegalClause>
        <LegalClause num="5.">
          <p>
            <strong>Goods</strong> means the goods advertised on the Website that we supply to you of the number and
            description as set out in the Order;
          </p>
        </LegalClause>
        <LegalClause num="6.">
          <p>
            <strong>Order</strong> means the Customer&apos;s order for the Goods from the Supplier as submitted
            following the step by step process set out on the Website;
          </p>
        </LegalClause>
        <LegalClause num="7.">
          <p>
            <strong>Privacy Policy</strong> means the terms which set out how we will deal with confidential and
            personal information received from you via the Website;
          </p>
        </LegalClause>
        <LegalClause num="8.">
          <p>
            <strong>Website</strong> means our website{" "}
            <Link href="/" className="text-brass-700 underline hover:text-brass-900">
              www.sanfurniture.com
            </Link>{" "}
            on which the Goods are advertised.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="goods" title="Goods">
        <LegalClause num="1.">
          <p>
            The description of the Goods is as set out in the Website, catalogues, brochures or other form of
            advertisement. Any description is for illustrative purposes only and there may be small discrepancies in
            the size and colour of the Goods supplied.
          </p>
        </LegalClause>
        <LegalClause num="2.">
          <p>
            In the case of any Goods made to your special requirements, it is your responsibility to ensure that any
            information or specification you provide is accurate.
          </p>
        </LegalClause>
        <LegalClause num="3.">
          <p>All Goods which appear on the Website are subject to availability.</p>
        </LegalClause>
        <LegalClause num="4.">
          <p>
            We can make changes to the Goods which are necessary to comply with any applicable law or safety
            requirement. We will notify you of these changes.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="personal-information" title="Personal Information and Registration">
        <LegalClause num="1.">
          <p>
            When registering to use the Website you must set up a username and password. You remain responsible for
            all actions taken under the chosen username and password and undertake not to disclose your username and
            password to anyone else and keep them secret.
          </p>
        </LegalClause>
        <LegalClause num="2.">
          <p>
            We retain and use all information strictly under the{" "}
            <Link href="/privacy" className="text-brass-700 underline hover:text-brass-900">
              Privacy Policy
            </Link>
            .
          </p>
        </LegalClause>
        <LegalClause num="3.">
          <p>
            We may contact you by using e-mail or other electronic communication methods and by pre-paid post and you
            expressly agree to this.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="basis-of-sale" title="Basis of Sale">
        <LegalClause num="1.">
          <p>
            The description of the Goods in our website does not constitute a contractual offer to sell the Goods. When
            an Order has been submitted on the Website, we can reject it for any reason, although we will try to tell
            you the reason without delay.
          </p>
        </LegalClause>
        <LegalClause num="2.">
          <p>
            The Order process is set out on the Website. Each step allows you to check and amend any errors before
            submitting the Order. It is your responsibility to check that you have used the ordering process
            correctly.
          </p>
        </LegalClause>
        <LegalClause num="3.">
          <p>
            A Contract will be formed for the sale of Goods ordered only when you receive an email from us confirming
            the Order (Order Confirmation). You must ensure that the Order Confirmation is complete and accurate and
            inform us immediately of any errors. We are not responsible for any inaccuracies in the Order placed by
            you. By placing an Order you agree to us giving you confirmation of the Contract by means of an email
            with all information in it (ie the Order Confirmation). You will receive the Order Confirmation within a
            reasonable time after making the Contract, but in any event not later than the delivery of any Goods
            supplied under the Contract.
          </p>
        </LegalClause>
        <LegalClause num="4.">
          <p>
            Any quotation is valid for a maximum period of 7 days from its date, unless we expressly withdraw it at
            an earlier time.
          </p>
        </LegalClause>
        <LegalClause num="5.">
          <p>
            No variation of the Contract, whether about description of the Goods, Fees or otherwise, can be made after
            it has been entered into unless the variation is agreed by the Customer and the Supplier in writing.
          </p>
        </LegalClause>
        <LegalClause num="6.">
          <p>
            We intend that these Terms and Conditions apply only to a Contract entered into by you as a Consumer. If
            this is not the case, you must tell us, so that we can provide you with a different contract with terms
            which are more appropriate for you and which might, in some respects, be better for you, eg by giving you
            rights as a business.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="price-and-payment" title="Price and Payment">
        <LegalClause num="1.">
          <p>
            The price of the Goods and any additional delivery or other charges is that set out on the Website at the
            date of the Order or such other price as we may agree in writing.
          </p>
        </LegalClause>
        <LegalClause num="2.">
          <p>Prices and charges include VAT at the rate applicable at the time of the Order.</p>
        </LegalClause>
        <LegalClause num="3.">
          <p>
            You must pay by submitting your credit or debit card details with your Order and we can take payment
            immediately or otherwise before delivery of the Goods.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="delivery" title="Delivery">
        <LegalClause num="1.">
          <p>
            We will deliver the Goods, to the Delivery Location by the time or within the agreed period or, failing
            any agreement, without undue delay and, in any event, not more than 30 days after the day on which the
            Contract is entered into.
          </p>
        </LegalClause>
        <LegalClause num="2.">
          <p>
            In any case, regardless of events beyond our control, if we do not deliver the Goods on time, you can (in
            addition to any other remedies) treat the Contract at an end if:
          </p>
          <LegalClause num="2.1" indent>
            <p>
              we have refused to deliver the Goods, or if delivery on time is essential taking into account all the
              relevant circumstances at the time the Contract was made, or you said to us before the Contract was made
              that delivery on time was essential; or
            </p>
          </LegalClause>
          <LegalClause num="2.2" indent>
            <p>
              after we have failed to deliver on time, you have specified a later period which is appropriate to the
              circumstances and we have not delivered within that period.
            </p>
          </LegalClause>
        </LegalClause>
        <LegalClause num="3.">
          <p>
            If you treat the Contract at an end, we will (in addition to other remedies) promptly return all payments
            made under the Contract.
          </p>
        </LegalClause>
        <LegalClause num="4.">
          <p>
            If you were entitled to treat the Contract at an end, but do not do so, you are not prevented from
            cancelling the Order for any Goods or rejecting Goods that have been delivered and, if you do this, we will
            (in addition to other remedies) without delay return all payments made under the Contract for any such
            cancelled or rejected Goods. If the Goods have been delivered, you must return them to us or allow us to
            collect them from you and we will pay the costs of this.
          </p>
        </LegalClause>
        <LegalClause num="5.">
          <p>
            If any Goods form a commercial unit (a unit is a commercial unit if division of the unit would materially
            impair the value of the goods or the character of the unit) you cannot cancel or reject the Order for some
            of those Goods without also cancelling or rejecting the Order for the rest of them.
          </p>
        </LegalClause>
        <LegalClause num="6.">
          <p>
            We do not generally deliver to addresses outside England and Wales, Scotland, Northern Ireland, the Isle of
            Man and the Channels Islands. If, however, we accept an Order for delivery outside that area, you may need
            to pay import duties or other taxes, as we will not pay them.
          </p>
        </LegalClause>
        <LegalClause num="7.">
          <p>
            You agree we may deliver the Goods in instalments if we suffer a shortage of stock or other genuine and
            fair reason, subject to the above provisions and provided you are not liable for extra charges.
          </p>
        </LegalClause>
        <LegalClause num="8.">
          <p>
            If you or your nominee fail, through no fault of ours, to take delivery of the Goods at the Delivery
            Location, we may charge the reasonable costs of storing and redelivering them.
          </p>
        </LegalClause>
        <LegalClause num="9.">
          <p>
            The Goods will become your responsibility from the completion of delivery or Customer collection. You must,
            if reasonably practicable, examine the Goods before accepting them.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="risk-and-title" title="Risk and Title">
        <LegalClause num="1.">
          <p>Risk of damage to, or loss of, any Goods will pass to you when the Goods are delivered to you.</p>
        </LegalClause>
        <LegalClause num="2.">
          <p>
            You do not own the Goods until we have received payment in full. If full payment is overdue or a step
            occurs towards your bankruptcy, we can choose, by notice to cancel any delivery and end any right to use
            the Goods still owned by you, in which case you must return them or allow us to collect them.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="withdrawal-returns" title="Withdrawal, Returns and Cancellation">
        <LegalClause num="1.">
          <p>
            You can withdraw the Order by telling us before the Contract is made, if you simply wish to change your
            mind and without giving us a reason, and without incurring any liability.
          </p>
        </LegalClause>
        <LegalClause num="2.">
          <p>
            This is a distance contract (as defined below) which has the cancellation rights (Cancellation Rights) set
            out below. These Cancellation Rights, however, do not apply, to a contract for the following goods (with
            no others) in the following circumstances:
          </p>
          <LegalClause num="2.1" indent>
            <p>
              foodstuffs, beverages or other goods intended for current consumption in the household and which are
              supplied on frequent and regular rounds to your residence or workplace;
            </p>
          </LegalClause>
          <LegalClause num="2.2" indent>
            <p>goods that are made to your specifications or are clearly personalised;</p>
          </LegalClause>
          <LegalClause num="2.3" indent>
            <p>goods which are liable to deteriorate or expire rapidly.</p>
          </LegalClause>
        </LegalClause>
        <LegalClause num="3.">
          <p>Also, the Cancellation Rights for a Contract cease to be available in the following circumstances:</p>
          <LegalClause num="3.1" indent>
            <p>
              in the case of any sales contract, if the goods become mixed inseparably (according to their nature) with
              other items after delivery.
            </p>
          </LegalClause>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="right-to-cancel" title="Right to Cancel">
        <LegalClause num="1.">
          <p>
            Subject as stated in these Terms and Conditions, you can cancel this contract within 14 days without giving
            any reason.
          </p>
        </LegalClause>
        <LegalClause num="2.">
          <p>
            The cancellation period will expire after 14 days from the day on which you acquire, or a third party,
            other than the carrier indicated by you, acquires physical possession of the last of the Goods. In a
            contract for the supply of goods over time (ie subscriptions), the right to cancel will be 14 days after
            the first delivery.
          </p>
        </LegalClause>
        <LegalClause num="3.">
          <p>
            To exercise the right to cancel, you must inform us of your decision to cancel this Contract by a clear
            statement setting out your decision (eg a letter sent by post or email). You can use the attached model
            cancellation form, but it is not obligatory. In any event, you must be able to show clear evidence of when
            the cancellation was made, so you may decide to use the model cancellation form.
          </p>
        </LegalClause>
        <LegalClause num="4.">
          <p>
            You can also electronically fill in and submit the model cancellation form or any other clear statement of
            the Customer&apos;s decision to cancel the Contract on our website{" "}
            <Link href="/" className="text-brass-700 underline hover:text-brass-900">
              www.sanfurniture.com
            </Link>
            . If you use this option, we will communicate to you an acknowledgement of receipt of such a cancellation
            in a Durable Medium (eg by email) without delay.
          </p>
        </LegalClause>
        <LegalClause num="5.">
          <p>
            To meet the cancellation deadline, it is sufficient for you to send your communication concerning your
            exercise of the right to cancel before the cancellation period has expired.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="effects-of-cancellation" title="Effects of Cancellation in the Cancellation Period">
        <LegalClause num="1.">
          <p>
            Except as set out below, if you cancel this Contract, we will reimburse to you all payments received from
            you, including the costs of delivery (except for the supplementary costs arising if you chose a type of
            delivery other than the least expensive type of standard delivery offered by us).
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="deduction-for-goods" title="Deduction for Goods Supplied">
        <LegalClause num="1.">
          <p>
            We may make a deduction from the reimbursement for loss in value of any Goods supplied, if the loss is the
            result of unnecessary handling by you (ie handling the Goods beyond what is necessary to establish the
            nature, characteristics and functioning of the Goods: eg it goes beyond the sort of handling that might be
            reasonably allowed in a shop). This is because you are liable for that loss and, if that deduction is not
            made, you must pay us the amount of that loss.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="timing-of-reimbursement" title="Timing of Reimbursement">
        <LegalClause num="1.">
          <p>
            If we have not offered to collect the Goods, we will make the reimbursement without undue delay, and not
            later than:
          </p>
          <LegalClause num="1.1" indent>
            <p>14 days after the day we receive back from you any Goods supplied, or</p>
          </LegalClause>
          <LegalClause num="1.2" indent>
            <p>(if earlier) 14 days after the day you provide evidence that you have sent back the Goods.</p>
          </LegalClause>
        </LegalClause>
        <LegalClause num="2.">
          <p>
            If we have offered to collect the Goods or if no Goods were supplied, we will make the reimbursement
            without undue delay, and not later than 14 days after the day on which we are informed about your decision
            to cancel this Contract.
          </p>
        </LegalClause>
        <LegalClause num="3.">
          <p>
            We will make the reimbursement using the same means of payment as you used for the initial transaction,
            unless you have expressly agreed otherwise; in any event, you will not incur any fees as a result of the
            reimbursement.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="returning-goods" title="Returning Goods">
        <LegalClause num="1.">
          <p>
            If you have received Goods in connection with the Contract which you have cancelled, you must send back
            the Goods or hand them over to us at the address provided by email (warehouse return address will be
            confirmed by email), without delay and in any event not later than 14 days from the day on which you
            communicate to us your cancellation of this Contract. The deadline is met if you send back the Goods
            before the period of 14 days has expired. You agree that you will have to bear the cost of returning the
            Goods.
          </p>
        </LegalClause>
        <LegalClause num="2.">
          <p>For the purposes of these Cancellation Rights, these words have the following meanings:</p>
          <LegalClause num="2.1" indent>
            <p>
              <strong>distance contract</strong> means a contract concluded between a trader and a consumer under an
              organised distance sales or service-provision scheme without the simultaneous physical presence of the
              trader and the consumer, with the exclusive use of one or more means of distance communication up to
              and including the time at which the contract is concluded;
            </p>
          </LegalClause>
          <LegalClause num="2.2" indent>
            <p>
              <strong>sales contract</strong> means a contract under which a trader transfers or agrees to transfer the
              ownership of goods to a consumer and the consumer pays or agrees to pay the price, including any contract
              that has both goods and services as its object.
            </p>
          </LegalClause>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="conformity" title="Conformity">
        <LegalClause num="1.">
          <p>
            We have a legal duty to supply the Goods in conformity with the Contract, and will not have conformed if it
            does not meet the following obligation.
          </p>
        </LegalClause>
        <LegalClause num="2.">
          <p>Upon delivery, the Goods will:</p>
          <LegalClause num="2.1" indent>
            <p>be of satisfactory quality;</p>
          </LegalClause>
          <LegalClause num="2.2" indent>
            <p>
              be reasonably fit for any particular purpose for which you buy the Goods which, before the Contract is
              made, you made known to us (unless you do not actually rely, or it is unreasonable for you to rely, on
              our skill and judgment) and be fit for any purpose held out by us or set out in the Contract; and
            </p>
          </LegalClause>
          <LegalClause num="2.3" indent>
            <p>conform to their description.</p>
          </LegalClause>
        </LegalClause>
        <LegalClause num="3.">
          <p>It is not a failure to conform if the failure has its origin in your materials.</p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="successors-subcontractors" title="Successors and Our Sub-Contractors">
        <LegalClause num="1.">
          <p>
            Either party can transfer the benefit of this Contract to someone else, and will remain liable to the
            other for its obligations under the Contract. The Supplier will be liable for the acts of any
            sub-contractors who it chooses to help perform its duties.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard
        id="circumstances-beyond-control"
        title="Circumstances Beyond the Control of Either Party"
      >
        <LegalClause num="1.">
          <p>In the event of any failure by a party because of something beyond its reasonable control:</p>
          <LegalClause num="1.1" indent>
            <p>the party will advise the other party as soon as reasonably practicable; and</p>
          </LegalClause>
          <LegalClause num="1.2" indent>
            <p>
              the party&apos;s obligations will be suspended so far as is reasonable, provided that that party will act
              reasonably, and the party will not be liable for any failure which it could not reasonably avoid, but
              this will not affect the Customer&apos;s above rights relating to delivery and any right to cancel,
              below.
            </p>
          </LegalClause>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="privacy" title="Privacy">
        <LegalClause num="1.">
          <p>
            Your privacy is critical to us. We respect your privacy and comply with the General Data Protection
            Regulation with regard to your personal information.
          </p>
        </LegalClause>
        <LegalClause num="2.">
          <p>
            These Terms and Conditions should be read alongside, and are in addition to our policies, including our
            Privacy Policy (
            <Link href="/privacy" className="text-brass-700 underline hover:text-brass-900">
              https://www.sanfurniture.com/privacy
            </Link>
            ) and Cookies Policy (
            <Link href="/privacy#cookies" className="text-brass-700 underline hover:text-brass-900">
              https://www.sanfurniture.com/privacy
            </Link>
            ).
          </p>
        </LegalClause>
        <LegalClause num="3.">
          <p>For the purposes of these Terms and Conditions:</p>
          <LegalClause num="3.1" indent>
            <p>
              &apos;Data Protection Laws&apos; means any applicable law relating to the processing of Personal Data,
              including, but not limited to the GDPR.
            </p>
          </LegalClause>
          <LegalClause num="3.2" indent>
            <p>&apos;GDPR&apos; means the UK General Data Protection Regulation.</p>
          </LegalClause>
          <LegalClause num="3.3" indent>
            <p>
              &apos;Data Controller&apos;, &apos;Personal Data&apos; and &apos;Processing&apos; shall have the same
              meaning as in the GDPR.
            </p>
          </LegalClause>
        </LegalClause>
        <LegalClause num="4.">
          <p>We are a Data Controller of the Personal Data we Process in providing Goods to you.</p>
        </LegalClause>
        <LegalClause num="5.">
          <p>
            Where you supply Personal Data to us so we can provide Goods to you, and we Process that Personal Data in
            the course of providing the Goods to you, we will comply with our obligations imposed by the Data
            Protection Laws:
          </p>
          <LegalClause num="5.1" indent>
            <p>
              before or at the time of collecting Personal Data, we will identify the purposes for which information
              is being collected;
            </p>
          </LegalClause>
          <LegalClause num="5.2" indent>
            <p>we will only Process Personal Data for the purposes identified;</p>
          </LegalClause>
          <LegalClause num="5.3" indent>
            <p>we will respect your rights in relation to your Personal Data; and</p>
          </LegalClause>
          <LegalClause num="5.4" indent>
            <p>
              we will implement technical and organisational measures to ensure your Personal Data is secure.
            </p>
          </LegalClause>
        </LegalClause>
        <LegalClause num="6.">
          <p>
            For any enquiries or complaints regarding data privacy, you can e-mail:{" "}
            <a href="mailto:privacy@sanfurniture.com" className="text-brass-700 underline hover:text-brass-900">
              privacy@sanfurniture.com
            </a>
            .
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="excluding-liability" title="Excluding Liability">
        <LegalClause num="1.">
          <p>
            The Supplier does not exclude liability for: (i) any fraudulent act or omission; or (ii) for death or
            personal injury caused by negligence or breach of the Supplier&apos;s other legal obligations. Subject to
            this, the Supplier is not liable for (i) loss which was not reasonably foreseeable to both parties at the
            time when the Contract was made, or (ii) loss (eg loss of profit) to the Customer&apos;s business, trade,
            craft or profession which would not be suffered by a Consumer - because the Supplier believes the Customer
            is not buying the Goods wholly or mainly for its business, trade, craft or profession.
          </p>
        </LegalClause>
      </LegalSectionCard>

      <LegalSectionCard id="governing-law" title="Governing Law, Jurisdiction and Complaints">
        <LegalClause num="1.">
          <p>The Contract (including any non-contractual matters) is governed by the law of England and Wales.</p>
        </LegalClause>
        <LegalClause num="2.">
          <p>
            Disputes can be submitted to the jurisdiction of the courts of England and Wales or, where the Customer
            lives in Scotland or Northern Ireland, in the courts of respectively Scotland or Northern Ireland.
          </p>
        </LegalClause>
        <LegalClause num="3.">
          <p>
            We try to avoid any dispute, so we deal with complaints in the following way: If a dispute occurs customers
            should contact us to find a solution. We will aim to respond with an appropriate solution within 5 days.
          </p>
        </LegalClause>
      </LegalSectionCard>
    </LegalDocumentLayout>
  );
}
