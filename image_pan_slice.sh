# input.png found at https://cloud-o67g3jvnt-hack-club-bot.vercel.app/0chara_sprite_intro.png
# this will create a file for each frame– filesystems beware
wget --output-document input.png https://cloud-o67g3jvnt-hack-club-bot.vercel.app/0chara_sprite_intro.png
pan_size=300
rm slide_*.png
for i in {0..$pan_size..5}
do
  top_cut=$(expr $i)
  bot_cut=$(expr $pan_size - $i)
  convert input.png -gravity South -chop 0x$bot_cut -gravity North -chop 0x$top_cut slide_$(printf "%05d" $i).png
done
convert -delay 30 -loop 1 slide_*.png animation.gif
rm slide_*.png