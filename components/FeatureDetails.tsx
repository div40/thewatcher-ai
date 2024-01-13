import { Separator } from "./ui/separator";

const FeatureDetails = () => {
  return (
    <div className="text-xs text-muted-foreground">
      <ul className="space-y-4">
        <li>
          <strong>Dark Mode/ System Theme 🌗</strong>
          <p>Toggle between dark mode and system theme.</p>
        </li>
        <li>
          <strong>Mirror Camera ↔️</strong>
          <p>Adjust horizontal orientation.</p>
        </li>
        <Separator />
        <li>
          <strong>Take Pictures 📸</strong>
          <p>Capture snapshots at any moment from the video feed.</p>
        </li>
        <li>
          <strong>Manual Video Recording 📽️</strong>
          <p>Manually record video clips as needed.</p>
        </li>
        <Separator />
        <li>
          <strong>Enable/Disable Auto Record 🚫</strong>
          <p>Enable or disable automatic video recording whenever required.</p>
        </li>
        <li>
          <strong>Volume Slider 🔊</strong>
          <p>Adjust the volume level of the notifications.</p>
        </li>
        <li>
          <strong>Camera Feed Highlighting 🎨</strong>
          <p>
            Highlights persons in <span style={{ color: "#FF0F0F" }}>red</span>{" "}
            and other objects in <span style={{ color: "#00B612" }}>green</span>
            .
          </p>
        </li>
        <Separator />
        <li className="space-y-4">
          <strong>Share your thoughts 💬 </strong>
          {/* <SocialMediaLinks/> */}
          <br />
          <br />
          <br />
        </li>
      </ul>
    </div>
  );
};

export default FeatureDetails;
