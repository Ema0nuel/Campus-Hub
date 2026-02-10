<script>
  import { page } from "$app/stores";
  import ChatWindow from "../components/ChatWindow.svelte";

  let participantId;
  let participantName;
  let participantPhone;

  $: if ($page.params) {
    participantId = $page.params.participantId;
    participantName = $page.params.participantName || "User";
    participantPhone = $page.params.participantPhone || "";
  }
</script>

<ChatWindow {participantId} {participantName} {participantPhone} />
